import json
from pathlib import Path
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Body
from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.models.profile import ApplicationProfile, ProfileUpdate

router = APIRouter(prefix="/profiles", tags=["Profiles"])

def _get_profiles_dir() -> Path:
    return settings.PROFILES_DIR

@router.get("", response_model=List[Dict[str, Any]])
def list_profiles():
    """List all configured application profiles."""
    profiles = []
    p_dir = _get_profiles_dir()
    for f in p_dir.glob("*.json"):
        try:
            with open(f, "r", encoding="utf-8") as fp:
                data = json.load(fp)
                profiles.append(data)
        except Exception as e:
            logger.error("Failed to read profile file %s: %s", f, e)
    return profiles

@router.get("/{profile_id}")
def get_profile(profile_id: str):
    """Retrieve detailed configuration for a specific profile."""
    p_dir = _get_profiles_dir()
    for f in p_dir.glob("*.json"):
        try:
            with open(f, "r", encoding="utf-8") as fp:
                data = json.load(fp)
                if data.get("id") == profile_id or data.get("profile_name") == profile_id:
                    return data
        except Exception:
            continue
    raise HTTPException(status_code=404, detail=f"Profile '{profile_id}' not found")

@router.post("")
def create_profile(profile_data: Dict[str, Any] = Body(...)):
    """Register a new application profile."""
    p_id = profile_data.get("id")
    if not p_id:
        raise HTTPException(status_code=400, detail="Profile 'id' is required")
    
    file_path = _get_profiles_dir() / f"{p_id}.json"
    with open(file_path, "w", encoding="utf-8") as fp:
        json.dump(profile_data, fp, indent=2)
    return {"status": "success", "message": f"Profile '{p_id}' saved successfully", "profile": profile_data}

@router.put("/{profile_id}")
def update_profile(profile_id: str, updates: Dict[str, Any] = Body(...)):
    """Edit permitted configuration values of an existing profile."""
    p_dir = _get_profiles_dir()
    target_file = None
    existing_data = None
    for f in p_dir.glob("*.json"):
        try:
            with open(f, "r", encoding="utf-8") as fp:
                data = json.load(fp)
                if data.get("id") == profile_id or data.get("profile_name") == profile_id:
                    target_file = f
                    existing_data = data
                    break
        except Exception:
            continue

    if not target_file or not existing_data:
        raise HTTPException(status_code=404, detail=f"Profile '{profile_id}' not found")

    # Deep merge permitted updates
    for k, v in updates.items():
        if k in ["parameters", "application_telemetry", "description", "status"]:
            if isinstance(v, dict) and isinstance(existing_data.get(k), dict):
                existing_data[k].update(v)
            else:
                existing_data[k] = v

    with open(target_file, "w", encoding="utf-8") as fp:
        json.dump(existing_data, fp, indent=2)

    return {"status": "success", "message": f"Profile '{profile_id}' updated successfully", "profile": existing_data}

@router.get("/{profile_id}/export")
def export_profile(profile_id: str):
    """Export profile as JSON."""
    return get_profile(profile_id)

@router.post("/import")
def import_profile(profile_data: Dict[str, Any] = Body(...)):
    """Import a profile JSON object."""
    return create_profile(profile_data)
