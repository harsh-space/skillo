import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime

# Path for local persistence
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
LOCAL_DB_FILE = os.path.join(DATA_DIR, "db_storage.json")


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
            "feedback_events": {}
        }
        self._load_local_db()

    def _init_firestore(self):
        cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        cred_json_str = os.getenv("FIREBASE_CREDENTIALS_JSON")

        try:
            import firebase_admin
            from firebase_admin import credentials, firestore

            cred = None
            if cred_path and os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
            elif cred_json_str:
                cred_dict = json.loads(cred_json_str)
                cred = credentials.Certificate(cred_dict)

            if cred:
                if not firebase_admin._apps:
                    firebase_admin.initialize_app(cred)
                self.firestore_db = firestore.client()
                print("[DB] Connected to live Firebase Firestore.")
            else:
                self.firestore_db = None
        except Exception as e:
            print(f"[DB Warning] Could not initialize Firestore: {e}. Using local JSON storage.")
            self.firestore_db = None

    def _load_local_db(self):
        if os.path.exists(LOCAL_DB_FILE):
            try:
                with open(LOCAL_DB_FILE, "r", encoding="utf-8") as f:
                    self.local_data = json.load(f)
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
        return self.local_data.get(collection, {}).get(doc_id)

    def list_documents(self, collection: str) -> List[Dict[str, Any]]:
        if self.firestore_db:
            try:
                docs = self.firestore_db.collection(collection).stream()
                return [d.to_dict() for d in docs]
            except Exception:
                pass
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
