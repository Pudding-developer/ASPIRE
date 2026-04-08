# Student ILO Skills Predictor (Prototype)

## What it does
- Uses your alignment workbook to map Program Outcomes (SO codes) to the 10 technical + 10 professional skills.
- Trains models from `Downloads/student_performance.csv` (course + ILO grade).
- Exposes a FastAPI endpoint `POST /predict` to:
  - predict technical/professional skill scores for the next-semester presentation
  - return strongest/weakest skills
  - compute a trend vs the previous stored prediction for the same student + course

## Train the models
From the project folder (`c:\\Users\\jayco\\VSCO\\Thesis`):

```powershell
python -m model.train
```

Artifacts will be saved to:
- `model\\artifacts\\skill_pipeline.joblib`
- `model\\artifacts\\outcome_pipeline.joblib`
- `model\\artifacts\\meta.json`

## Run the API
```powershell
uvicorn backend.api:app --reload --port 8000
```

## Call the endpoint
```json
{
  "student_id": "22-92021",
  "course": "CpE 401",
  "ilos": { "ILO1": 80, "ILO2": 85, "ILO3": 90, "ILO4": 88 }
}
```

Response includes:
- `predicted_skills` (list of `{skill, score}`)
- `strongest_skill`, `weakest_skill`
- `predicted_outcome` (remark label)
- optional `trend`

