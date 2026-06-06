import pytest
import io
from app.core.security import create_access_token
from app.models.admin import Admin
from app.models.curriculum import Curriculum, CurriculumSubject
from sqlmodel import select

@pytest.mark.asyncio
async def test_curriculum_flow(client, session):
    # 1. Check initial state is empty in test database
    res = await client.get("/api/curriculum")
    assert res.status_code == 200
    assert res.json() == []

    # 2. Seed some curriculum versions and subjects manually in DB
    c1 = Curriculum(name="BSCpE Curriculum 2018")
    session.add(c1)
    await session.commit()
    await session.refresh(c1)

    subj1 = CurriculumSubject(curriculum_id=c1.id, year="1", semester="1", code="ENGG 401", title="Introduction to Engineering")
    subj2 = CurriculumSubject(curriculum_id=c1.id, year="2", semester="1", code="CpE 401", title="Computer Programming 1")
    session.add(subj1)
    session.add(subj2)
    await session.commit()

    # Verify GET /api/curriculum fetches metadata
    res = await client.get("/api/curriculum")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["name"] == "BSCpE Curriculum 2018"

    # Verify GET /api/curriculum/{id}/subjects fetches and orders them
    res = await client.get(f"/api/curriculum/{c1.id}/subjects")
    assert res.status_code == 200
    subjects = res.json()
    assert len(subjects) == 2
    assert subjects[0]["code"] == "ENGG 401"
    assert subjects[1]["code"] == "CpE 401"

    # 3. Create Admin and test admin routes
    admin = Admin(email="admin@g.batstate-u.edu.ph", full_name="Admin User")
    session.add(admin)
    await session.commit()
    await session.refresh(admin)

    admin_token = create_access_token({"user_id": admin.id, "role": "admin"})
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Verify Admin GET route lists all curricula
    res = await client.get("/admin/curriculum", headers=admin_headers)
    assert res.status_code == 200
    assert len(res.json()["data"]) == 1

    # 4. Test uploading curriculum via CSV
    # One course (Differential Calculus) matches ML, and another (Unrecognized Course) does not.
    csv_content = (
        "year,semester,code,title\n"
        "1,1,MATH 401,Differential Calculus\n"
        "1,1,XYZ 100,Unrecognized Course"
    )
    files = {"file": ("curriculum.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    
    # Upload as a new curriculum
    res = await client.post("/admin/curriculum/upload?custom_name=New CSV Curriculum", files=files, headers=admin_headers)
    assert res.status_code == 200
    upload_res = res.json()["data"]
    assert upload_res["count"] == 2
    assert "Unrecognized Course" in upload_res["warnings"]
    assert "Differential Calculus" not in upload_res["warnings"]
    new_c_id = upload_res["curriculum_id"]
    assert upload_res["curriculum_name"] == "New CSV Curriculum"

    # Verify database was NOT cleared, and has both curricula
    db_curricula = (await session.execute(select(Curriculum))).scalars().all()
    assert len(db_curricula) == 2

    db_subjects = (await session.execute(select(CurriculumSubject).where(CurriculumSubject.curriculum_id == new_c_id))).scalars().all()
    assert len(db_subjects) == 2
    codes = {s.code for s in db_subjects}
    assert codes == {"MATH 401", "XYZ 100"}

    # 5. Test uploading curriculum via JSON
    json_content = (
        '['
        '  {"year": "1", "semester": "1", "code": "ENGG 401", "title": "Introduction to Engineering"},'
        '  {"year": "2", "semester": "2", "code": "CpE 402", "title": "Object Oriented Programming"}'
        ']'
    )
    files = {"file": ("curriculum.json", io.BytesIO(json_content.encode("utf-8")), "application/json")}
    
    res = await client.post("/admin/curriculum/upload", files=files, headers=admin_headers)
    assert res.status_code == 200
    upload_res = res.json()["data"]
    assert upload_res["count"] == 2
    assert len(upload_res["warnings"]) == 0
    another_c_id = upload_res["curriculum_id"]

    # Verify both previous and new curriculum exist (total 3 curricula)
    db_curricula = (await session.execute(select(Curriculum))).scalars().all()
    assert len(db_curricula) == 3

    db_subjects = (await session.execute(select(CurriculumSubject).where(CurriculumSubject.curriculum_id == another_c_id))).scalars().all()
    assert len(db_subjects) == 2
    codes = {s.code for s in db_subjects}
    assert codes == {"ENGG 401", "CpE 402"}
