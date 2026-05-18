"""
One-shot helper: rebuild COURSE_PROFILES in ml/config/targets.py
from the new ILO-Skillset alignment Excel.

Rule:
    - Skill marked '✓' in any ILO of a course  -> primary weight (0.9)
    - Skill marked '*' (and never '✓')          -> secondary weight (0.4)
    - Skill never appears                        -> 0.0  (skipped/under threshold)

Course-specific sub-skills (e.g. "Python Programming") are folded into the
20 master SKILL_CATEGORIES via SUBSKILL_TO_PARENT.
"""
from __future__ import annotations

import re
from pathlib import Path
import pandas as pd

XLSX = Path("/home/humunculey/ASPIRE/backend/Documents/BSCpE_ILO_Skillset_Alignment.xlsx")
TARGETS_PY = Path("/home/humunculey/ASPIRE/backend/ml/config/targets.py")

PRIMARY_W = 0.9
SECONDARY_W = 0.4

SKILL_CATEGORIES = [
    "Mathematics & Science Foundations",
    "Programming & Software Development",
    "Hardware & Circuit Design",
    "Embedded & Microprocessor Systems",
    "Networking & Communications",
    "Operating Systems & Architecture",
    "Signal Processing & Control Systems",
    "Data Science & AI/ML",
    "Engineering Design & Research",
    "Modern Engineering Tools",
    "Communication",
    "Ethics & Professionalism",
    "Critical Thinking & Problem-Solving",
    "Leadership & Teamwork",
    "Project Management",
    "Lifelong Learning",
    "Societal & National Responsibility",
    "Sustainability Awareness",
    "Cultural & Global Competence",
    "Entrepreneurial Mindset",
]

# Sub-skills used in the Excel that aren't in the 20 master categories.
# Each sub-skill is folded into one (or more) parent master skills.
SUBSKILL_TO_PARENTS: dict[str, list[str]] = {
    "Python Programming":                  ["Programming & Software Development"],
    "Object-Oriented Programming (Java)":  ["Programming & Software Development"],
    "Software Design Principles":          ["Programming & Software Development"],
    "Software Architecture & Design Patterns": ["Programming & Software Development"],
    "Software Development":                ["Programming & Software Development"],
    "Programming Logic & Flowcharting":    ["Programming & Software Development"],
    "Data Structures & Algorithms":        ["Programming & Software Development"],
    "Computational Logic":                 ["Programming & Software Development",
                                            "Mathematics & Science Foundations"],
    "Numerical Computing":                 ["Programming & Software Development",
                                            "Mathematics & Science Foundations"],
    "Systems Programming":                 ["Programming & Software Development",
                                            "Operating Systems & Architecture"],
    "Embedded C/Assembly Programming":     ["Embedded & Microprocessor Systems",
                                            "Programming & Software Development"],
    "Firmware Development":                ["Embedded & Microprocessor Systems",
                                            "Programming & Software Development"],
    "HDL/Verilog Programming":             ["Hardware & Circuit Design"],
    "DSP Algorithm Implementation":        ["Signal Processing & Control Systems"],
    "Applied Computer Engineering Practice": ["Engineering Design & Research"],
}

# Course code -> existing course name in targets.py (matches what the DB stores)
CODE_TO_NAME: dict[str, str] = {
    "ENGG 401": "Introduction to Engineering",
    "GEd 101":  "Understanding the Self",
    "GEd 102":  "Mathematics in the Modern World",
    "GEd 105":  "Readings in Philippine History",
    "GEd 106":  "Purposive Communication",
    "MATH 401": "Differential Calculus",
    "SCl 401":  "General Chemistry",
    "CpE 401":  "Computer Programming 1",
    "ENGG 402": "Engineering Drawing",
    "GEd 104":  "Contemporary World",
    "GEd 108":  "Art Appreciation",
    "GEd 109":  "Science, Technology and Society",
    "MATH 402": "Integral Calculus",
    "SCI 403":  "Physics 1",
    "GEd 103":  "Life and Works of Rizal",
    "GEd 107":  "Ethics",
    "SCI 402":  "Modern Biology",
    "CpE 403":  "Computer Engineering as a Discipline",
    "CpE 404":  "Programming Logic and Design",
    "CpE 405":  "Discrete Mathematics",
    "EE 423":   "Fundamentals of Electrical Engineering",
    "ENGG 403": "Computer-Aided Design",
    "ENGG 404": "Engineering Economics",
    "MATH 403": "Engineering Data Analysis",
    "MATH 404": "Differential Equations",
    "CpE 406":  "Object Oriented Programming",
    "CpE 408":  "Advanced Engineering Mathematics for CpE",
    "CpEE 401": "Cognate/Elective Course 1",
    "ECE 421":  "Electronic Circuits: Devices and Analysis",
    "ENGG 411": "Basic Occupational Health and Safety",
    "ENGG 414": "Numerical Methods",
    "Fili 101": "Kontekstwalisadong Komunikasyon sa Filipino",
    "CpE 410":  "Logic Circuits and Design",
    "CpE 411":  "Data Structures and Algorithms",
    "CpE 412":  "Introduction to Networks, Data and Digital Communications (CISCO 1)",
    "CpE 413":  "Fundamentals of Mixed Signals and Sensors",
    "CpE 414":  "Feedback and Control Systems",
    "CpE 415":  "Introduction to HDL",
    "ENGG 416": "Research Methods",
    "Fili 102": "Filipino sa Iba't Ibang Disiplina",
    "CpE 417":  "Microprocessors",
    "CpE 418":  "Software Design",
    "CpE 419":  "Routing and Switching (CISCO 2)",
    "CpE 420":  "Digital Signal Processing",
    "CpE 421":  "Emerging Technologies in CpE",
    "CpE 422":  "CpE Practice and Design 1",
    "CpEE 402": "Cognate/Elective Course 2",
    "CpE 423":  "Scaling Networks (CISCO 3)",
    "CpE 424":  "Operating Systems",
    "CpE 425":  "Computer Architecture and Organization",
    "CpE 426":  "Computer Engineering Drafting and Design",
    "CpE 427":  "Connecting Networks and Security (CISCO 4)",
    "CpE 428":  "Embedded Systems",
    "CpE 429":  "Seminars and Fieldtrips",
    "IE 424":   "Manufacturing and Quality Control",
    "CpEE 403": "Cognate/Elective Course 3 (Data Mining / AI Track)",
    "Litr 102": "ASEAN Literature",
    "ENGG 405": "Technopreneurship",
    "ENGG 417": "On-the-Job Training",
    "CpE 430":  "CpE Practice and Design 2",
}


def _expand(skill: str) -> list[str]:
    """Map a skill label (master or sub-skill) to a list of master skills."""
    if skill in SKILL_CATEGORIES:
        return [skill]
    if skill in SUBSKILL_TO_PARENTS:
        return SUBSKILL_TO_PARENTS[skill]
    print(f"  ! UNKNOWN skill ignored: {skill!r}")
    return []


def parse_excel() -> dict[str, list[float]]:
    df = pd.read_excel(XLSX, sheet_name="ILO–Skillset Alignment", header=None)

    profiles: dict[str, list[float]] = {}
    current_code: str | None = None
    current_marks: dict[str, str] = {}  # master_skill -> '✓' (wins) or '*'

    def flush():
        if current_code is None:
            return
        name = CODE_TO_NAME.get(current_code)
        if not name:
            print(f"  ! No name mapping for course code {current_code}")
            return
        weights = []
        for s in SKILL_CATEGORIES:
            mark = current_marks.get(s)
            weights.append(PRIMARY_W if mark == "✓"
                           else SECONDARY_W if mark == "*"
                           else 0.0)
        profiles[name] = weights

    for _, row in df.iterrows():
        c0, c2, c5, c6 = row[0], row[2], row[5], row[6]

        # Course header detector: contains "·" but not "Bachelor"/"BATANGAS"
        if isinstance(c0, str) and "·" in c0 and "Bachelor" not in c0 and "BATANGAS" not in c0:
            flush()
            current_code = c0.split("·")[0].strip()
            current_marks = {}
            continue

        if isinstance(c2, str) and c2.strip().startswith("ILO"):
            for cell in (c5, c6):
                if not isinstance(cell, str) or cell.strip() == "—":
                    continue
                for line in cell.split("\n"):
                    line = line.strip()
                    if not line or line[0] not in "✓*":
                        continue
                    marker, label = line[0], line[1:].strip()
                    for parent in _expand(label):
                        prev = current_marks.get(parent)
                        if marker == "✓" or prev != "✓":
                            current_marks[parent] = marker
    flush()
    return profiles


def render_profile_block(profiles: dict[str, list[float]]) -> str:
    lines = []
    for name, weights in profiles.items():
        formatted = ", ".join(f"{w:.1f}" for w in weights)
        # escape any ' in the course name
        safe = name.replace('"', r'\"')
        lines.append(f'    "{safe}":\n        [{formatted}],')
    return "\n".join(lines)


def main() -> None:
    profiles = parse_excel()
    print(f"\nParsed {len(profiles)} courses.")

    expected = set(CODE_TO_NAME.values())
    got = set(profiles.keys())
    missing = expected - got
    extra = got - expected
    if missing:
        print(f"  ! missing courses (in code map, not in profiles): {missing}")
    if extra:
        print(f"  ! extra courses (in profiles, not in code map): {extra}")

    # Read targets.py and surgically replace COURSE_PROFILES dict body.
    src = TARGETS_PY.read_text(encoding="utf-8")
    block = render_profile_block(profiles)
    new_dict = "COURSE_PROFILES: Dict[str, List[float]] = {\n" + block + "\n}\n"

    pattern = re.compile(
        r"COURSE_PROFILES: Dict\[str, List\[float\]\] = \{.*?\n\}\n",
        re.DOTALL,
    )
    if not pattern.search(src):
        raise RuntimeError("Could not locate COURSE_PROFILES dict in targets.py")
    new_src = pattern.sub(new_dict, src, count=1)
    TARGETS_PY.write_text(new_src, encoding="utf-8")
    print(f"\n✔ Updated {TARGETS_PY}")


if __name__ == "__main__":
    main()
