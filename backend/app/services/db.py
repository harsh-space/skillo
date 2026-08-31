import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime

# Prevent gRPC segmentation faults in containerized async environments
os.environ["GRPC_ENABLE_FORK_SUPPORT"] = "0"
os.environ["GRPC_POLL_STRATEGY"] = "epoll1"

# Path for local persistence & project root
APP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(APP_DIR, "data")
BACKEND_DIR = os.path.dirname(APP_DIR)
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
LOCAL_DB_FILE = os.path.join(DATA_DIR, "db_storage.json")

# Ensure .env is loaded
from dotenv import load_dotenv
load_dotenv(os.path.join(PROJECT_ROOT, ".env"), override=False)


class DatabaseClient:
    """
    Unified database client that connects to Firebase Firestore if configured via
    GOOGLE_APPLICATION_CREDENTIALS path or FIREBASE_CREDENTIALS_JSON string,
    or transparently falls back to local JSON storage for zero-config execution.
    """
    def __init__(self):
        self.firestore_db = None
        self._init_firestore()
        self.local_data: Dict[str, Dict[str, Any]] = {
            "skills": {},
            "roles": {},
            "prerequisites": {},
            "resources": {},
            "learners": {},
            "roadmaps": {},
            "feedback_events": {},
            "users": {}
        }
        self._load_local_db()

    def _init_firestore(self):
        cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        cred_json_str = (
            os.getenv("FIREBASE_CREDENTIALS_JSON")
            or os.getenv("FIREBASE_KEY_JSON")
            or os.getenv("FIREBASE_SERVICE_ACCOUNT")
        )

        try:
            import firebase_admin
            from firebase_admin import credentials, firestore

            cred = None
            resolved_path = None

            # Check potential credential file paths
            candidate_paths = []
            if cred_path:
                candidate_paths.extend([
                    cred_path,
                    os.path.join(PROJECT_ROOT, cred_path),
                    os.path.join(BACKEND_DIR, cred_path),
                    os.path.join(BACKEND_DIR, os.path.basename(cred_path))
                ])
            
            # Also check common default filenames
            for default_name in ["firebase-key.json", "firbase-key.json", "serviceAccountKey.json"]:
                candidate_paths.extend([
                    os.path.join(BACKEND_DIR, default_name),
                    os.path.join(PROJECT_ROOT, default_name),
                    default_name
                ])

            for p in candidate_paths:
                if p and os.path.exists(p) and os.path.isfile(p):
                    resolved_path = os.path.abspath(p)
                    break

            if resolved_path:
                cred = credentials.Certificate(resolved_path)
                print(f"[DB] Initializing Firebase with key from: {resolved_path}")
            elif cred_json_str:
                cred_dict = json.loads(cred_json_str) if isinstance(cred_json_str, str) else cred_json_str
                # Normalize escaped newlines in private_key if passed via env var
                if isinstance(cred_dict, dict) and "private_key" in cred_dict:
                    if "\\n" in cred_dict["private_key"]:
                        cred_dict["private_key"] = cred_dict["private_key"].replace("\\n", "\n")
                cred = credentials.Certificate(cred_dict)

            if cred:
                if not firebase_admin._apps:
                    firebase_admin.initialize_app(cred)
                self.firestore_db = firestore.client()
                print("[DB] SUCCESS: Connected to live Firebase Firestore database!")
            else:
                self.firestore_db = None
                print("[DB] No valid Firebase credentials found. Running in local fallback mode.")
        except Exception as e:
            print(f"[DB Warning] Could not initialize Firestore: {e}. Using local JSON storage.")
            self.firestore_db = None

    def _load_local_db(self):
        # 1. Always load curated seed collections directly from their source files
        try:
            skills_file = os.path.join(DATA_DIR, "seed_skills.json")
            if os.path.exists(skills_file):
                with open(skills_file, "r", encoding="utf-8") as f:
                    skills = json.load(f)
                    self.local_data["skills"] = {s["skill_id"]: s for s in skills}

            roles_file = os.path.join(DATA_DIR, "seed_roles.json")
            if os.path.exists(roles_file):
                with open(roles_file, "r", encoding="utf-8") as f:
                    roles = json.load(f)
                    self.local_data["roles"] = {r["role_id"]: r for r in roles}

            prereqs_file = os.path.join(DATA_DIR, "seed_prerequisites.json")
            if os.path.exists(prereqs_file):
                with open(prereqs_file, "r", encoding="utf-8") as f:
                    prereqs = json.load(f)
                    self.local_data["prerequisites"] = {
                        f"edge_{p['from_skill_id']}_{p['to_skill_id']}": p for p in prereqs
                    }

            res_file = os.path.join(DATA_DIR, "seed_resources.json")
            if os.path.exists(res_file):
                with open(res_file, "r", encoding="utf-8") as f:
                    resources = json.load(f)
                    self.local_data["resources"] = {r["resource_id"]: r for r in resources}
        except Exception as e:
            print(f"[DB Warning] Could not load seed files: {e}")

        # 2. Load dynamic learner/roadmap records from db_storage.json if exists
        if os.path.exists(LOCAL_DB_FILE):
            try:
                with open(LOCAL_DB_FILE, "r", encoding="utf-8") as f:
                    stored = json.load(f)
                    for dynamic_col in ["learners", "roadmaps", "feedback_events", "roadmap_history", "users"]:
                        if dynamic_col in stored:
                            self.local_data[dynamic_col] = stored[dynamic_col]
            except Exception:
                pass

    def _save_local_db(self):
        try:
            os.makedirs(DATA_DIR, exist_ok=True)
            with open(LOCAL_DB_FILE, "w", encoding="utf-8") as f:
                json.dump(self.local_data, f, indent=2)
        except Exception as e:
            print(f"[DB Warning] Could not write local db file: {e}")

    def set_document(self, collection: str, doc_id: str, data: Dict[str, Any]):
        if collection not in self.local_data:
            self.local_data[collection] = {}
        self.local_data[collection][doc_id] = data
        self._save_local_db()

        if self.firestore_db:
            try:
                self.firestore_db.collection(collection).document(doc_id).set(data, timeout=3.0)
            except Exception as e:
                print(f"[DB Error] Firestore set failed for {collection}/{doc_id}: {e}")

    def get_document(self, collection: str, doc_id: str) -> Optional[Dict[str, Any]]:
        # Fast memory check first
        local_val = self.local_data.get(collection, {}).get(doc_id)
        if local_val:
            return local_val

        if self.firestore_db:
            try:
                doc = self.firestore_db.collection(collection).document(doc_id).get(timeout=3.0)
                if doc.exists:
                    val = doc.to_dict()
                    if val:
                        if collection not in self.local_data:
                            self.local_data[collection] = {}
                        self.local_data[collection][doc_id] = val
                        return val
            except Exception:
                pass
        return None

    def list_documents(self, collection: str) -> List[Dict[str, Any]]:
        # 1. Fast static taxonomy return
        if collection in ["skills", "roles", "prerequisites", "resources"]:
            self._load_local_db()
            items = list(self.local_data.get(collection, {}).values())
            if items:
                return items

        if self.firestore_db:
            try:
                docs = self.firestore_db.collection(collection).stream(timeout=3.0)
                res = [d.to_dict() for d in docs if d.exists]
                if res:
                    return res
            except Exception:
                pass
        self._load_local_db()
        return list(self.local_data.get(collection, {}).values())

    def update_document(self, collection: str, doc_id: str, updates: Dict[str, Any]):
        doc = self.get_document(collection, doc_id) or {}
        doc.update(updates)
        self.set_document(collection, doc_id, doc)

    def delete_document(self, collection: str, doc_id: str):
        if collection in self.local_data and doc_id in self.local_data[collection]:
            del self.local_data[collection][doc_id]
            self._save_local_db()

        if self.firestore_db:
            try:
                self.firestore_db.collection(collection).document(doc_id).delete(timeout=3.0)
            except Exception:
                pass

    def query_documents(self, collection: str, field: str, value: Any) -> List[Dict[str, Any]]:
        # 1. Fast local memory query first
        local_matches = [d for d in self.local_data.get(collection, {}).values() if d.get(field) == value]
        if local_matches:
            return local_matches

        if self.firestore_db:
            try:
                docs = self.firestore_db.collection(collection).where(field, "==", value).stream(timeout=3.0)
                res = [d.to_dict() for d in docs if d.exists]
                if res:
                    return res
            except Exception:
                pass
        return local_matches


# Global singleton instance
db = DatabaseClient()
