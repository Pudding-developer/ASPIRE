from fastapi import APIRouter, Depends
from app.api.deps import get_current_instructor
from app.models.instructor import Instructor

router = APIRouter()

@router.get("/profile")
async def get_instructor_profile(instructor: Instructor = Depends(get_current_instructor)):
    # This automatically enforces token verification AND the is_active database check!
    return {
        "message": "Instructor profile data",
        "data": {
            "id": instructor.id,
            "email": instructor.email,
            "full_name": instructor.full_name,
            "is_active": instructor.is_active,
        }
    }
