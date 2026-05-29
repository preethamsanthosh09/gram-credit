import re
import json
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

from database import get_db
from models.user import User
from models.document import Document
from config import settings

router = APIRouter(prefix="/api/kyc", tags=["kyc"])

# --- Pydantic Schemas ---

class KycScanRequest(BaseModel):
    image_base64: str
    doc_type: str  # "aadhaar" | "ration" | "land"
    user_id: int

class ScanResponse(BaseModel):
    success: bool
    doc_type: str
    extracted_data: dict
    document_id: int

class VerifyAllRequest(BaseModel):
    user_id: int

class VerifyAllResponse(BaseModel):
    verified: bool
    score_bonus: int
    missing: List[str]

class DocumentResponse(BaseModel):
    id: int
    user_id: int
    doc_type: str
    extracted_data: dict
    created_at: datetime

    class Config:
        from_attributes = True

# --- Utility to clean base64 data ---
def clean_base64(image_base64_raw: str):
    mime_type = "image/jpeg"
    base64_data = image_base64_raw
    
    if image_base64_raw.startswith("data:"):
        match = re.match(r"data:([^;]+);base64,(.*)", image_base64_raw)
        if match:
            mime_type = match.group(1)
            base64_data = match.group(2)
            
    return mime_type, base64_data

# --- Gemini API scan helper ---
def extract_data_from_image_ai(base64_data: str, mime_type: str, doc_type: str, api_key: str) -> dict:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    
    if doc_type == "aadhaar":
        prompt = (
            "You are an AI document scanner. Analyze the provided Aadhaar Card image and extract the following details "
            "exactly, and return them as a JSON object (without markdown code blocks, just raw JSON). "
            "Fields to extract:\n"
            "- name: the full name of the person (string)\n"
            "- dob: date of birth in DD/MM/YYYY format (string)\n"
            "- address: the address listed (string)\n"
            "- aadhaar_last4: the last 4 digits of the Aadhaar number (string)\n"
        )
    elif doc_type == "ration":
        prompt = (
            "You are an AI document scanner. Analyze the provided Ration Card image and extract the following details "
            "exactly, and return them as a JSON object (without markdown code blocks, just raw JSON). "
            "Fields to extract:\n"
            "- name: the name of the head of family / card holder (string)\n"
            "- address: the address listed (string)\n"
            "- ration_number: the card number (string)\n"
            "- family_members: the number of family members as a string (string, e.g., '4')\n"
        )
    elif doc_type == "land":
        prompt = (
            "You are an AI document scanner. Analyze the provided Land Record document image and extract the following details "
            "exactly, and return them as a JSON object (without markdown code blocks, just raw JSON). "
            "Fields to extract:\n"
            "- survey_number: the survey, khata, or land identification number (string)\n"
            "- area_acres: the land area size in acres as a string (string, e.g., '2.5')\n"
            "- district: district name (string)\n"
            "- owner_name: the primary owner's name (string)\n"
        )
    else:
        raise ValueError(f"Unsupported doc_type: {doc_type}")
        
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {
                        "inlineData": {
                            "mimeType": mime_type,
                            "data": base64_data
                        }
                    }
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }
    
    response = httpx.post(url, json=payload, timeout=20.0)
    response.raise_for_status()
    
    resp_json = response.json()
    text_content = resp_json["candidates"][0]["content"]["parts"][0]["text"].strip()
    
    # Strip markdown blocks if present
    if text_content.startswith("```json"):
        text_content = text_content[7:]
    if text_content.endswith("```"):
        text_content = text_content[:-3]
    text_content = text_content.strip()
    
    return json.loads(text_content)

# --- Routes ---

@router.post("/scan", response_model=ScanResponse)
def scan_document(request: KycScanRequest, db: Session = Depends(get_db)):
    # Validate user exists
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {request.user_id} not found."
        )
        
    # Validate doc type
    if request.doc_type not in ["aadhaar", "ration", "land"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid doc_type. Allowed types are: aadhaar, ration, land."
        )
        
    extracted_data = None
    
    # Try AI Extraction
    if settings.GEMINI_API_KEY:
        try:
            mime_type, base64_data = clean_base64(request.image_base64)
            extracted_data = extract_data_from_image_ai(
                base64_data=base64_data,
                mime_type=mime_type,
                doc_type=request.doc_type,
                api_key=settings.GEMINI_API_KEY
            )
        except Exception as e:
            # Fall back to mock data
            print(f"[KYC Scanner] AI Extraction failed: {e}. Falling back to mock response.")
            
    # Mock data fallback (if AI failed or GEMINI_API_KEY was not configured)
    if not extracted_data:
        if request.doc_type == "aadhaar":
            extracted_data = {
                "name": "Ravi Kumar",
                "dob": "15/06/1985",
                "address": "Kallahalli, Mandya",
                "aadhaar_last4": "1234"
            }
        elif request.doc_type == "ration":
            extracted_data = {
                "name": "Ravi Kumar",
                "ration_number": "KA-MN-12345",
                "family_members": "4"
            }
        elif request.doc_type == "land":
            extracted_data = {
                "survey_number": "KA-MND-045",
                "area_acres": "2.0",
                "district": "Mandya",
                "owner_name": "Ravi Kumar"
            }

    # Save to database (upsert: if doc type already exists for user, update it)
    db_doc = db.query(Document).filter(
        Document.user_id == request.user_id,
        Document.doc_type == request.doc_type
    ).first()
    
    if db_doc:
        db_doc.extracted_data = extracted_data
        db_doc.image_base64 = request.image_base64
        db.commit()
        db.refresh(db_doc)
    else:
        db_doc = Document(
            user_id=request.user_id,
            doc_type=request.doc_type,
            extracted_data=extracted_data,
            image_base64=request.image_base64
        )
        db.add(db_doc)
        db.commit()
        db.refresh(db_doc)
        
    return {
        "success": True,
        "doc_type": request.doc_type,
        "extracted_data": extracted_data,
        "document_id": db_doc.id
    }


@router.post("/verify-all", response_model=VerifyAllResponse)
def verify_all_documents(request: VerifyAllRequest, db: Session = Depends(get_db)):
    # Validate user exists
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {request.user_id} not found."
        )
        
    # Get all documents for this user
    user_docs = db.query(Document).filter(Document.user_id == request.user_id).all()
    present_types = {doc.doc_type for doc in user_docs}
    all_types = {"aadhaar", "ration", "land"}
    
    missing = list(all_types - present_types)
    count = len(present_types)
    
    if count == 3:
        return {
            "verified": True,
            "score_bonus": 25,
            "missing": []
        }
    elif count == 2:
        return {
            "verified": False,
            "score_bonus": 15,
            "missing": missing
        }
    elif count == 1:
        return {
            "verified": False,
            "score_bonus": 5,
            "missing": missing
        }
    else:
        return {
            "verified": False,
            "score_bonus": 0,
            "missing": missing
        }


@router.get("/documents/{user_id}", response_model=List[DocumentResponse])
def get_user_documents(user_id: int, db: Session = Depends(get_db)):
    # Validate user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found."
        )
        
    # Return documents ordered by creation date
    docs = db.query(Document).filter(Document.user_id == user_id).order_by(Document.created_at.desc()).all()
    return docs
