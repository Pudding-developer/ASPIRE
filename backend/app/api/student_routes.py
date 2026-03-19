from fastapi import APIRouter

router = APIRouter()

@router.get("/profile")
async def get_student_profile():
    return {"message": "Student profile data"}
