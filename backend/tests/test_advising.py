import pytest
from app.core.security import create_access_token
from app.models.user import User
from app.models.instructor import Instructor
from app.models.admin import Admin

@pytest.mark.asyncio
async def test_advising_flow(client, session):
    # 1. Create entities in database
    admin = Admin(email="admin@g.batstate-u.edu.ph", full_name="Admin User")
    session.add(admin)
    
    inst1 = Instructor(email="adv1@g.batstate-u.edu.ph", full_name="Advisor One", is_active=True)
    inst2 = Instructor(email="adv2@g.batstate-u.edu.ph", full_name="Advisor Two", is_active=True)
    session.add(inst1)
    session.add(inst2)
    
    student = User(
        sr_code="22-11111",
        email="22-11111@g.batstate-u.edu.ph",
        full_name="Student One",
        role="student"
    )
    session.add(student)
    await session.commit()
    await session.refresh(admin)
    await session.refresh(inst1)
    await session.refresh(inst2)
    await session.refresh(student)

    # Generate Auth tokens
    admin_token = create_access_token({"user_id": admin.id, "role": "admin"})
    inst1_token = create_access_token({"user_id": inst1.id, "role": "instructor"})
    inst2_token = create_access_token({"user_id": inst2.id, "role": "instructor"})
    
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    inst1_headers = {"Authorization": f"Bearer {inst1_token}"}
    inst2_headers = {"Authorization": f"Bearer {inst2_token}"}

    # 2. Verify admin can assign advisor
    r = await client.put(
        f"/admin/students/{student.id}/advisor",
        json={"advisor_id": inst1.id},
        headers=admin_headers
    )
    assert r.status_code == 200
    assert r.json()["message"] == "Advisor assigned successfully."

    # Check database reflection
    await session.refresh(student)
    assert student.advisor_id == inst1.id

    # 3. Verify instructor 1 (assigned advisor) can access advisee endpoints
    r = await client.get("/api/instructor/advisees", headers=inst1_headers)
    assert r.status_code == 200
    advisees = r.json()["data"]
    assert len(advisees) == 1
    assert advisees[0]["id"] == student.id

    # Verify instructor 1 can call student scores (returns 200, empty array since no grades)
    r = await client.get(f"/api/instructor/advisees/{student.id}/scores", headers=inst1_headers)
    assert r.status_code == 200
    assert r.json()["data"] == []

    # 4. Verify instructor 2 (not advisor) cannot access advisee endpoints for student
    # List advisees should be empty for advisor 2
    r = await client.get("/api/instructor/advisees", headers=inst2_headers)
    assert r.status_code == 200
    assert r.json()["data"] == []

    # Accessing student scores should return 403 NOT_YOUR_ADVISEE
    r = await client.get(f"/api/instructor/advisees/{student.id}/scores", headers=inst2_headers)
    assert r.status_code == 403
    assert r.headers.get("x-error-code") == "NOT_YOUR_ADVISEE"
