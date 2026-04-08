"""
Run once to regenerate student_ilo_data.csv with realistic multi-course data.

    python -m model.generate_dataset
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

from .targets import COURSE_PROFILES, COURSE_SEMESTER

# ── Config ────────────────────────────────────────────────────────────────────
N_STUDENTS = 80
NOISE_ILO  = 6.0
SEED       = 42

FIRST_NAMES = [
    "Alex", "Maria", "Juan", "Ana", "Carlos", "Sofia", "Miguel", "Carla",
    "Luis", "Rosa", "Diego", "Elena", "Pedro", "Isabel", "Gabriel", "Camila",
    "Andres", "Lucia", "Rafael", "Valentina", "Marco", "Aidan", "Jose", "Mia",
]
LAST_NAMES = [
    "Santos", "Garcia", "Reyes", "Cruz", "Torres", "Mendoza",
    "Flores", "Aquino", "Ramos", "Castro", "Dela Cruz", "Bautista",
]

# Course type drives which student affinity is applied
COURSE_TYPE: dict[str, str] = {
    # Year 1 Sem 1
    "Introduction to Engineering":              "general",
    "Understanding the Self":                   "general",
    "Mathematics in the Modern World":          "math",
    "Readings in Philippine History":           "general",
    "Purposive Communication":                  "general",
    "Differential Calculus":                    "math",
    "General Chemistry":                        "math",
    "Computer Programming 1":                   "prog",
    # Year 1 Sem 2
    "Engineering Drawing":                      "hw",
    "Contemporary World":                       "general",
    "Art Appreciation":                         "general",
    "Science, Technology and Society":          "general",
    "Integral Calculus":                        "math",
    "Physics 1":                                "math",
    # Year 2 Sem 1
    "Life and Works of Rizal":                  "general",
    "Ethics":                                   "general",
    "Modern Biology":                           "math",
    "Computer Engineering as a Discipline":     "general",
    "Programming Logic and Design":             "prog",
    "Discrete Mathematics":                     "math",
    "Fundamentals of Electrical Engineering":   "hw",
    "Computer-Aided Design":                    "hw",
    # Year 2 Sem 2
    "Engineering Economics":                    "general",
    "Engineering Data Analysis":                "math",
    "Differential Equations":                   "math",
    "Object Oriented Programming":              "prog",
    "Advanced Engineering Mathematics for CpE": "math",
    "Cognate/Elective Course 1":                "prog",
    "Electronic Circuits: Devices and Analysis":"hw",
    "Basic Occupational Health and Safety":     "general",
    "Numerical Methods":                        "math",
    "Kontekstwalisadong Komunikasyon sa Filipino": "general",
    # Year 3 Sem 1
    "Logic Circuits and Design":                "hw",
    "Data Structures and Algorithms":           "prog",
    "Introduction to Networks, Data and Digital Communications (CISCO 1)": "prog",
    "Fundamentals of Mixed Signals and Sensors":"hw",
    "Feedback and Control Systems":             "math",
    "Introduction to HDL":                      "hw",
    "Research Methods":                         "general",
    "Filipino sa Iba't Ibang Disiplina":        "general",
    # Year 3 Sem 2
    "Microprocessors":                          "hw",
    "Software Design":                          "prog",
    "Routing and Switching (CISCO 2)":          "prog",
    "Digital Signal Processing":                "math",
    "Emerging Technologies in CpE":             "prog",
    "CpE Practice and Design 1":                "general",
    "Cognate/Elective Course 2":                "prog",
    # Year 4 Sem 1
    "Scaling Networks (CISCO 3)":               "prog",
    "Operating Systems":                        "prog",
    "Computer Architecture and Organization":   "hw",
    "Computer Engineering Drafting and Design": "hw",
    "Connecting Networks and Security (CISCO 4)": "prog",
    "Embedded Systems":                         "hw",
    "Seminars and Fieldtrips":                  "general",
    "Manufacturing and Quality Control":        "hw",
    "Cognate/Elective Course 3 (Data Mining / AI Track)": "prog",
    "ASEAN Literature":                         "general",
    # Year 4 Sem 2
    "Technopreneurship":                        "general",
    "On-the-Job Training":                      "general",
    "CpE Practice and Design 2":                "general",
}


def generate(output_path: Path, seed: int = SEED) -> None:
    rng = np.random.default_rng(seed)

    ability  = np.clip(rng.normal(0.50, 0.18, N_STUDENTS), 0.10, 0.90)
    math_aff = np.clip(rng.normal(0.50, 0.18, N_STUDENTS), 0.10, 0.90)
    prog_aff = np.clip(rng.normal(0.50, 0.18, N_STUDENTS), 0.10, 0.90)
    hw_aff   = np.clip(rng.normal(0.50, 0.18, N_STUDENTS), 0.10, 0.90)

    ids   = [f"22-{rng.integers(10000, 99999):05d}" for _ in range(N_STUDENTS)]
    first = rng.choice(FIRST_NAMES, N_STUDENTS)
    last  = rng.choice(LAST_NAMES,  N_STUDENTS)
    names = [f"{f} {l}" for f, l in zip(first, last)]

    courses = list(COURSE_PROFILES.keys())

    rows: list[dict] = []
    for i in range(N_STUDENTS):
        sid, name = ids[i], names[i]
        for course in courses:
            sem   = COURSE_SEMESTER.get(course, 4)
            ctype = COURSE_TYPE.get(course, "general")

            if ctype == "math":
                aff = math_aff[i]
            elif ctype == "prog":
                aff = prog_aff[i]
            elif ctype == "hw":
                aff = hw_aff[i]
            else:
                aff = (math_aff[i] + prog_aff[i] + hw_aff[i]) / 3.0

            base = 62.0 + ability[i] * 22.0 + aff * 10.0
            difficulties = [1.00, 0.97, 0.93, 0.88]
            ilo_scores = [
                float(np.clip(base * d + rng.normal(0, NOISE_ILO), 60.0, 98.0))
                for d in difficulties
            ]
            rows.append({
                "SR-CODE":  sid,
                "NAME":     name,
                "Semester": sem,
                "Course":   course,
                "ILO1":     round(ilo_scores[0], 1),
                "ILO2":     round(ilo_scores[1], 1),
                "ILO3":     round(ilo_scores[2], 1),
                "ILO4":     round(ilo_scores[3], 1),
            })

    df = pd.DataFrame(rows)
    df.to_csv(output_path, index=False)
    print(f"Generated {len(df)} rows -> {output_path}")
    print(f"  Students : {N_STUDENTS}")
    print(f"  Courses  : {len(courses)}")
    print(f"  ILO range: {df[['ILO1','ILO2','ILO3','ILO4']].min().min():.1f}"
          f" - {df[['ILO1','ILO2','ILO3','ILO4']].max().max():.1f}")


if __name__ == "__main__":
    thesis_root = Path(__file__).resolve().parents[1]
    generate(thesis_root / "student_ilo_data.csv")
