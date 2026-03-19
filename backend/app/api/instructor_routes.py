from fastapi import APIRouter

router = APIRouter()

@router.get("/profile")
async def get_instructor_profile():
    return {"message": "Instructor profile data"}
