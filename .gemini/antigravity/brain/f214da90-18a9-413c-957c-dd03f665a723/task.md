# Task Checklist: Versioned Curriculum Uploads

- `[x]` Update `Curriculum` and `CurriculumSubject` models in `backend/app/models/curriculum.py`
- `[x]` Update class model in `backend/app/models/class_model.py` to add `curriculum_id`
- `[x]` Add `curriculum_id` migration query inside `backend/app/core/database.py` during `init_db()`
- `[x]` Adjust default startup database seeder in `backend/main.py`
- `[x]` Update curriculum routes in `backend/app/api/curriculum_routes.py` (versioned listing and subjects list)
- `[x]` Update admin routes in `backend/app/api/admin_routes.py` and `backend/app/services/admin_service.py` to support multiple uploads without deletion
- `[x]` Update `class_service.py` and `instructor_class_routes.py` to save `curriculum_id` on class creation
- `[x]` Update `CurriculumTab.jsx` component in Admin panel to list versioned curricula
- `[x]` Update `CreateClassModal` in `InstructorModals.jsx` to select curriculum version first
- `[x]` Update and run integration tests in `backend/tests/test_curriculum.py`
- `[x]` Verify everything end-to-end
