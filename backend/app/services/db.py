import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime

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
        cred_json_str = os.getenv("FIREBASE_CREDENTIALS_JSON")

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
                cred_dict = json.loads(cred_json_str)
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
                    for dynamic_col in ["learners", "roadmaps", "feedback_events"]:
                        if dynamic_col in stored:
                            self.local_data[dynamic_col] = stored[dynamic_col]
            except Exception:
                pass

    def _save_local_db(self):
        os.makedirs(DATA_DIR, exist_ok=True)
        with open(LOCAL_DB_FILE, "w", encoding="utf-8") as f:
            json.dump(self.local_data, f, indent=2)

    def set_document(self, collection: str, doc_id: str, data: Dict[str, Any]):
        if self.firestore_db:
            try:
                self.firestore_db.collection(collection).document(doc_id).set(data)
            except Exception as e:
                print(f"[DB Error] Firestore set failed: {e}, saving locally.")
        if collection not in self.local_data:
            self.local_data[collection] = {}
        self.local_data[collection][doc_id] = data
        self._save_local_db()

    def get_document(self, collection: str, doc_id: str) -> Optional[Dict[str, Any]]:
        if self.firestore_db:
            try:
                doc = self.firestore_db.collection(collection).document(doc_id).get()
                if doc.exists:
                    return doc.to_dict()
            except Exception:
                pass
        self._load_local_db()
        return self.local_data.get(collection, {}).get(doc_id)

    def list_documents(self, collection: str) -> List[Dict[str, Any]]:
        if self.firestore_db:
            try:
                docs = self.firestore_db.collection(collection).stream()
                return [d.to_dict() for d in docs]
            except Exception:
                pass
        self._load_local_db()
        return list(self.local_data.get(collection, {}).values())

    def update_document(self, collection: str, doc_id: str, updates: Dict[str, Any]):
        doc = self.get_document(collection, doc_id) or {}
        doc.update(updates)
        self.set_document(collection, doc_id, doc)

    def delete_document(self, collection: str, doc_id: str):
        if self.firestore_db:
            try:
                self.firestore_db.collection(collection).document(doc_id).delete()
            except Exception:
                pass
        if collection in self.local_data and doc_id in self.local_data[collection]:
            del self.local_data[collection][doc_id]
            self._save_local_db()

    def query_documents(self, collection: str, field: str, value: Any) -> List[Dict[str, Any]]:
        if self.firestore_db:
            try:
                docs = self.firestore_db.collection(collection).where(field, "==", value).stream()
                return [d.to_dict() for d in docs]
            except Exception:
                pass
        docs = list(self.local_data.get(collection, {}).values())
        return [d for d in docs if d.get(field) == value]


# Global singleton instance
db = DatabaseClient()
