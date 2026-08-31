import hashlib
import os
import secrets
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Header, Depends

from app.models.schemas import UserSignupRequest, UserLoginRequest, UserResponse
from app.services.db import db

router = APIRouter(prefix="/auth", tags=["auth"])


def _hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    if not salt:
        salt = secrets.token_hex(16)
    salted = f"{password}:{salt}".encode("utf-8")
    pwd_hash = hashlib.sha256(salted).hexdigest()
    return pwd_hash, salt


def _verify_password(password: str, stored_hash: str, salt: str) -> bool:
    pwd_hash, _ = _hash_password(password, salt)
    return pwd_hash == stored_hash


@router.post("/signup", response_model=UserResponse)
def signup(req: UserSignupRequest):
    email = req.email.strip().lower()
    name = req.name.strip()

    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="A valid email address is required.")
    if not name:
        raise HTTPException(status_code=400, detail="Name is required.")
    if len(req.password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters long.")

    # Check if user already exists
    existing_users = db.query_documents("users", "email", email)
    if existing_users:
        target_user = existing_users[0]
        stored_hash = target_user.get("password_hash", "")
        salt = target_user.get("salt", "")
        if _verify_password(req.password, stored_hash, salt):
            # Password matches: auto-login existing user seamlessly
            token = target_user.get("token") or secrets.token_hex(24)
            target_user["token"] = token
            target_user["updated_at"] = datetime.now(timezone.utc).isoformat()
            db.set_document("users", target_user["user_id"], target_user)
            return UserResponse(
                user_id=target_user["user_id"],
                name=target_user.get("name", name),
                email=target_user.get("email", email),
                learner_id=target_user.get("learner_id", f"learner_{target_user['user_id']}"),
                token=token
            )
        raise HTTPException(status_code=409, detail="An account with this email already exists. Please sign in instead.")

    user_id = f"user_{secrets.token_hex(8)}"
    clean_name = name.lower().replace(" ", "_")
    clean_name = "".join(c for c in clean_name if c.isalnum() or c == "_")
    learner_id = f"learner_{clean_name}_{secrets.token_hex(4)}"

    pwd_hash, salt = _hash_password(req.password)
    token = secrets.token_hex(24)
    now = datetime.now(timezone.utc).isoformat()

    user_doc = {
        "user_id": user_id,
        "name": name,
        "email": email,
        "password_hash": pwd_hash,
        "salt": salt,
        "learner_id": learner_id,
        "token": token,
        "created_at": now,
        "updated_at": now
    }

    # Save to users collection
    db.set_document("users", user_id, user_doc)

    # Initialize learner profile
    learner_doc = {
        "learner_id": learner_id,
        "user_id": user_id,
        "name": name,
        "current_skills": ["HTML", "CSS", "Python (basic)"],
        "target_role_id": "role_backend_developer",
        "created_at": now,
        "updated_at": now
    }
    db.set_document("learners", learner_id, learner_doc)

    return UserResponse(
        user_id=user_id,
        name=name,
        email=email,
        learner_id=learner_id,
        token=token
    )


@router.post("/login", response_model=UserResponse)
def login(req: UserLoginRequest):
    email = req.email.strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required.")

    existing_users = db.query_documents("users", "email", email)
    if not existing_users:
        # Check all users as fallback
        all_u = db.list_documents("users")
        existing_users = [u for u in all_u if str(u.get("email", "")).strip().lower() == email]

    if not existing_users:
        raise HTTPException(status_code=401, detail="No account found with this email. Please click 'Create Account' to sign up.")

    target_user = existing_users[0]
    stored_hash = target_user.get("password_hash", "")
    salt = target_user.get("salt", "")

    if not _verify_password(req.password, stored_hash, salt):
        raise HTTPException(status_code=401, detail="Incorrect password. Please try again.")

    # Generate or reuse token
    token = target_user.get("token") or secrets.token_hex(24)
    target_user["token"] = token
    target_user["updated_at"] = datetime.now(timezone.utc).isoformat()
    db.set_document("users", target_user["user_id"], target_user)

    return UserResponse(
        user_id=target_user["user_id"],
        name=target_user.get("name", "Learner"),
        email=target_user.get("email", email),
        learner_id=target_user.get("learner_id", f"learner_{target_user['user_id']}"),
        token=token
    )


@router.get("/me", response_model=UserResponse)
def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header.")

    token = authorization.replace("Bearer ", "").strip()
    existing_users = db.list_documents("users")
    for u in existing_users:
        if u.get("token") == token:
            return UserResponse(
                user_id=u["user_id"],
                name=u.get("name", "Learner"),
                email=u.get("email", ""),
                learner_id=u.get("learner_id", f"learner_{u['user_id']}"),
                token=token
            )

    raise HTTPException(status_code=401, detail="Invalid or expired session token.")
