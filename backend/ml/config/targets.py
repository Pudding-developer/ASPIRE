from __future__ import annotations

from typing import Dict, List, Optional

import numpy as np

# ── Skill categories ──────────────────────────────────────────────────────────
SKILL_CATEGORIES: List[str] = [
    "Mathematics & Science Foundations",      # 0
    "Programming & Software Development",     # 1
    "Hardware & Circuit Design",              # 2
    "Embedded & Microprocessor Systems",      # 3
    "Networking & Communications",            # 4
    "Operating Systems & Architecture",       # 5
    "Signal Processing & Control Systems",    # 6
    "Data Science & AI/ML",                   # 7
    "Engineering Design & Research",          # 8
    "Modern Engineering Tools",               # 9
    "Technical Communication",                # 10
    "Ethics & Professionalism",               # 11
    "Critical Thinking & Problem-Solving",    # 12
    "Leadership & Teamwork",                  # 13
    "Project Management",                     # 14
    "Lifelong Learning",                      # 15
    "Societal & National Responsibility",     # 16
    "Sustainability Awareness",               # 17
    "Cultural & Global Competence",           # 18
    "Entrepreneurial Mindset",                # 19
]

# ── Real BSCpE course → skill weight profiles ─────────────────────────────────
# Keys are exact course titles from the school's curriculum (noted file).
# Each list has 20 values aligned with SKILL_CATEGORIES.
# Values (0–1): how strongly a course develops each skill.
#
# Idx:  0=Math  1=Prog  2=HW   3=Emb  4=Net  5=OS   6=Sig  7=DS   8=Des  9=Tool
#       10=TComm 11=Eth 12=Crit 13=Lead 14=PM 15=Life 16=Soc 17=Sust 18=Cult 19=Entr

COURSE_PROFILES: Dict[str, List[float]] = {

    # ── Year 1, Sem 1 ─────────────────────────────────────────────────────────
    "Introduction to Engineering":
        [0.1, 0.0, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.5, 0.1, 0.2, 0.4, 0.4, 0.3, 0.2, 0.4, 0.5, 0.3, 0.2, 0.2],
    "Understanding the Self":
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.3, 0.5, 0.3, 0.3, 0.0, 0.6, 0.4, 0.2, 0.5, 0.2],
    "Mathematics in the Modern World":
        [0.7, 0.0, 0.0, 0.0, 0.0, 0.0, 0.2, 0.2, 0.0, 0.0, 0.0, 0.0, 0.6, 0.0, 0.0, 0.3, 0.1, 0.0, 0.0, 0.0],
    "Readings in Philippine History":
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.3, 0.4, 0.2, 0.2, 0.0, 0.5, 0.8, 0.2, 0.5, 0.1],
    "Purposive Communication":
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.9, 0.3, 0.3, 0.4, 0.2, 0.3, 0.3, 0.1, 0.5, 0.2],
    "Differential Calculus":
        [0.9, 0.0, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.7, 0.0, 0.0, 0.2, 0.0, 0.0, 0.0, 0.0],
    "General Chemistry":
        [0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.2, 0.0, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.2, 0.1, 0.5, 0.0, 0.0],
    "Computer Programming 1":
        [0.0, 0.9, 0.0, 0.0, 0.0, 0.1, 0.0, 0.1, 0.0, 0.5, 0.0, 0.0, 0.7, 0.0, 0.0, 0.2, 0.0, 0.0, 0.0, 0.0],

    # ── Year 1, Sem 2 ─────────────────────────────────────────────────────────
    "Engineering Drawing":
        [0.1, 0.0, 0.2, 0.0, 0.0, 0.0, 0.0, 0.0, 0.7, 0.6, 0.2, 0.0, 0.3, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    "Contemporary World":
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.2, 0.4, 0.2, 0.2, 0.0, 0.4, 0.6, 0.5, 0.7, 0.2],
    "Art Appreciation":
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.3, 0.2, 0.2, 0.2, 0.0, 0.5, 0.2, 0.2, 0.7, 0.2],
    "Science, Technology and Society":
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.2, 0.5, 0.3, 0.2, 0.0, 0.5, 0.7, 0.7, 0.3, 0.2],
    "Integral Calculus":
        [0.9, 0.0, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.7, 0.0, 0.0, 0.2, 0.0, 0.0, 0.0, 0.0],
    "Physics 1":
        [0.7, 0.0, 0.3, 0.0, 0.0, 0.0, 0.6, 0.0, 0.1, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.2, 0.0, 0.0, 0.0, 0.0],

    # ── Year 2, Sem 1 ─────────────────────────────────────────────────────────
    "Life and Works of Rizal":
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.2, 0.5, 0.2, 0.3, 0.0, 0.5, 0.9, 0.2, 0.5, 0.1],
    "Ethics":
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.3, 0.9, 0.3, 0.4, 0.0, 0.5, 0.7, 0.4, 0.4, 0.2],
    "Modern Biology":
        [0.3, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.2, 0.0, 0.0, 0.0, 0.2, 0.4, 0.0, 0.0, 0.3, 0.3, 0.6, 0.0, 0.0],
    "Computer Engineering as a Discipline":
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.4, 0.0, 0.3, 0.7, 0.3, 0.4, 0.2, 0.5, 0.5, 0.3, 0.3, 0.3],
    "Programming Logic and Design":
        [0.1, 0.8, 0.0, 0.0, 0.0, 0.1, 0.0, 0.2, 0.0, 0.4, 0.0, 0.0, 0.7, 0.0, 0.0, 0.2, 0.0, 0.0, 0.0, 0.0],
    "Discrete Mathematics":
        [0.8, 0.3, 0.0, 0.0, 0.0, 0.0, 0.1, 0.3, 0.0, 0.0, 0.0, 0.0, 0.8, 0.0, 0.0, 0.2, 0.0, 0.0, 0.0, 0.0],
    "Fundamentals of Electrical Engineering":
        [0.5, 0.0, 0.9, 0.2, 0.0, 0.0, 0.6, 0.0, 0.2, 0.2, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    "Computer-Aided Design":
        [0.1, 0.2, 0.3, 0.0, 0.0, 0.0, 0.0, 0.0, 0.8, 0.9, 0.2, 0.0, 0.3, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],

    # ── Year 2, Sem 2 ─────────────────────────────────────────────────────────
    "Engineering Economics":
        [0.3, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.2, 0.2, 0.0, 0.2, 0.2, 0.5, 0.2, 0.4, 0.2, 0.2, 0.1, 0.0, 0.7],
    "Engineering Data Analysis":
        [0.8, 0.1, 0.0, 0.0, 0.0, 0.0, 0.3, 0.6, 0.0, 0.2, 0.0, 0.0, 0.7, 0.0, 0.0, 0.2, 0.0, 0.0, 0.0, 0.0],
    "Differential Equations":
        [0.9, 0.0, 0.0, 0.0, 0.0, 0.0, 0.7, 0.0, 0.1, 0.0, 0.0, 0.0, 0.7, 0.0, 0.0, 0.2, 0.0, 0.0, 0.0, 0.0],
    "Object Oriented Programming":
        [0.0, 0.9, 0.0, 0.0, 0.0, 0.2, 0.0, 0.3, 0.1, 0.5, 0.0, 0.0, 0.6, 0.0, 0.0, 0.2, 0.0, 0.0, 0.0, 0.0],
    "Advanced Engineering Mathematics for CpE":
        [0.9, 0.0, 0.0, 0.0, 0.0, 0.0, 0.6, 0.1, 0.0, 0.0, 0.0, 0.0, 0.7, 0.0, 0.0, 0.2, 0.0, 0.0, 0.0, 0.0],
    "Cognate/Elective Course 1":
        [0.3, 0.4, 0.3, 0.3, 0.2, 0.2, 0.2, 0.3, 0.2, 0.3, 0.0, 0.0, 0.5, 0.0, 0.0, 0.2, 0.0, 0.0, 0.0, 0.2],
    "Electronic Circuits: Devices and Analysis":
        [0.4, 0.0, 0.9, 0.3, 0.0, 0.0, 0.7, 0.0, 0.2, 0.2, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    "Basic Occupational Health and Safety":
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1, 0.0, 0.2, 0.7, 0.2, 0.2, 0.1, 0.3, 0.6, 0.8, 0.1, 0.1],
    "Numerical Methods":
        [0.7, 0.4, 0.0, 0.0, 0.0, 0.0, 0.3, 0.4, 0.0, 0.3, 0.0, 0.0, 0.7, 0.0, 0.0, 0.2, 0.0, 0.0, 0.0, 0.0],
    "Kontekstwalisadong Komunikasyon sa Filipino":
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.8, 0.2, 0.2, 0.2, 0.0, 0.4, 0.4, 0.1, 0.6, 0.1],

    # ── Year 3, Sem 1 ─────────────────────────────────────────────────────────
    "Logic Circuits and Design":
        [0.2, 0.2, 0.9, 0.5, 0.0, 0.1, 0.3, 0.0, 0.2, 0.3, 0.0, 0.0, 0.6, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    "Data Structures and Algorithms":
        [0.2, 0.8, 0.0, 0.0, 0.0, 0.1, 0.0, 0.5, 0.1, 0.3, 0.0, 0.0, 0.8, 0.0, 0.0, 0.2, 0.0, 0.0, 0.0, 0.0],
    "Introduction to Networks, Data and Digital Communications (CISCO 1)":
        [0.0, 0.2, 0.2, 0.1, 0.9, 0.4, 0.1, 0.1, 0.0, 0.3, 0.0, 0.0, 0.4, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    "Fundamentals of Mixed Signals and Sensors":
        [0.3, 0.0, 0.7, 0.5, 0.0, 0.0, 0.8, 0.0, 0.1, 0.2, 0.0, 0.0, 0.4, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    "Feedback and Control Systems":
        [0.5, 0.0, 0.3, 0.3, 0.0, 0.0, 0.9, 0.0, 0.2, 0.1, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    "Introduction to HDL":
        [0.1, 0.4, 0.9, 0.7, 0.0, 0.0, 0.2, 0.0, 0.1, 0.3, 0.0, 0.0, 0.4, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    "Research Methods":
        [0.2, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.4, 0.5, 0.2, 0.5, 0.2, 0.6, 0.2, 0.2, 0.4, 0.2, 0.1, 0.1, 0.2],
    "Filipino sa Iba't Ibang Disiplina":
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.8, 0.2, 0.2, 0.2, 0.0, 0.4, 0.4, 0.1, 0.6, 0.1],

    # ── Year 3, Sem 2 ─────────────────────────────────────────────────────────
    "Microprocessors":
        [0.1, 0.4, 0.6, 0.9, 0.0, 0.3, 0.3, 0.0, 0.2, 0.4, 0.0, 0.0, 0.4, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    "Software Design":
        [0.0, 0.8, 0.0, 0.0, 0.0, 0.3, 0.0, 0.3, 0.6, 0.5, 0.3, 0.2, 0.5, 0.4, 0.5, 0.2, 0.0, 0.0, 0.0, 0.3],
    "Routing and Switching (CISCO 2)":
        [0.0, 0.2, 0.1, 0.0, 0.9, 0.5, 0.0, 0.1, 0.0, 0.3, 0.0, 0.0, 0.4, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    "Digital Signal Processing":
        [0.5, 0.2, 0.1, 0.0, 0.0, 0.0, 0.9, 0.4, 0.1, 0.2, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    "Emerging Technologies in CpE":
        [0.1, 0.4, 0.2, 0.2, 0.3, 0.2, 0.1, 0.5, 0.4, 0.6, 0.2, 0.1, 0.4, 0.2, 0.1, 0.7, 0.2, 0.2, 0.3, 0.4],
    "CpE Practice and Design 1":
        [0.2, 0.4, 0.4, 0.3, 0.2, 0.2, 0.2, 0.2, 0.8, 0.5, 0.5, 0.3, 0.6, 0.6, 0.7, 0.3, 0.3, 0.2, 0.1, 0.3],
    "Cognate/Elective Course 2":
        [0.3, 0.4, 0.3, 0.3, 0.2, 0.2, 0.2, 0.4, 0.2, 0.3, 0.0, 0.0, 0.5, 0.0, 0.0, 0.2, 0.0, 0.0, 0.0, 0.2],

    # ── Year 4, Sem 1 ─────────────────────────────────────────────────────────
    "Scaling Networks (CISCO 3)":
        [0.0, 0.2, 0.1, 0.0, 0.9, 0.6, 0.0, 0.1, 0.0, 0.3, 0.0, 0.0, 0.4, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    "Operating Systems":
        [0.1, 0.5, 0.2, 0.4, 0.3, 0.9, 0.0, 0.2, 0.1, 0.4, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    "Computer Architecture and Organization":
        [0.2, 0.3, 0.6, 0.5, 0.2, 0.8, 0.0, 0.1, 0.1, 0.3, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    "Computer Engineering Drafting and Design":
        [0.1, 0.1, 0.4, 0.2, 0.0, 0.0, 0.0, 0.0, 0.8, 0.8, 0.2, 0.0, 0.4, 0.0, 0.2, 0.0, 0.0, 0.0, 0.0, 0.1],
    "Connecting Networks and Security (CISCO 4)":
        [0.0, 0.3, 0.1, 0.0, 0.9, 0.6, 0.0, 0.2, 0.1, 0.3, 0.0, 0.3, 0.4, 0.0, 0.0, 0.0, 0.2, 0.0, 0.0, 0.0],
    "Embedded Systems":
        [0.1, 0.5, 0.6, 0.9, 0.1, 0.3, 0.3, 0.0, 0.3, 0.5, 0.0, 0.0, 0.4, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    "Seminars and Fieldtrips":
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.2, 0.2, 0.1, 0.5, 0.4, 0.3, 0.5, 0.2, 0.7, 0.5, 0.3, 0.6, 0.3],
    "Manufacturing and Quality Control":
        [0.2, 0.0, 0.3, 0.0, 0.0, 0.0, 0.0, 0.2, 0.5, 0.4, 0.2, 0.3, 0.5, 0.3, 0.5, 0.1, 0.2, 0.5, 0.0, 0.3],
    "Cognate/Elective Course 3 (Data Mining / AI Track)":
        [0.3, 0.6, 0.0, 0.0, 0.1, 0.2, 0.1, 0.9, 0.2, 0.4, 0.0, 0.0, 0.5, 0.0, 0.0, 0.3, 0.0, 0.0, 0.0, 0.2],
    "ASEAN Literature":
        [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.4, 0.3, 0.2, 0.2, 0.0, 0.5, 0.4, 0.1, 0.8, 0.1],

    # ── Year 4, Sem 2 ─────────────────────────────────────────────────────────
    "Technopreneurship":
        [0.0, 0.2, 0.0, 0.0, 0.0, 0.0, 0.0, 0.2, 0.3, 0.3, 0.4, 0.2, 0.4, 0.6, 0.6, 0.3, 0.3, 0.2, 0.3, 0.9],
    "On-the-Job Training":
        [0.0, 0.3, 0.2, 0.2, 0.2, 0.2, 0.0, 0.1, 0.5, 0.4, 0.6, 0.4, 0.4, 0.7, 0.7, 0.6, 0.4, 0.2, 0.3, 0.5],
    "CpE Practice and Design 2":
        [0.2, 0.5, 0.4, 0.3, 0.2, 0.2, 0.2, 0.3, 0.9, 0.5, 0.7, 0.4, 0.6, 0.8, 0.8, 0.3, 0.4, 0.3, 0.2, 0.5],
}

# ── Semester assignment for each course ───────────────────────────────────────
COURSE_SEMESTER: Dict[str, int] = {
    # Year 1, Sem 1
    "Introduction to Engineering": 1,
    "Understanding the Self": 1,
    "Mathematics in the Modern World": 1,
    "Readings in Philippine History": 1,
    "Purposive Communication": 1,
    "Differential Calculus": 1,
    "General Chemistry": 1,
    "Computer Programming 1": 1,
    # Year 1, Sem 2
    "Engineering Drawing": 2,
    "Contemporary World": 2,
    "Art Appreciation": 2,
    "Science, Technology and Society": 2,
    "Integral Calculus": 2,
    "Physics 1": 2,
    # Year 2, Sem 1
    "Life and Works of Rizal": 3,
    "Ethics": 3,
    "Modern Biology": 3,
    "Computer Engineering as a Discipline": 3,
    "Programming Logic and Design": 3,
    "Discrete Mathematics": 3,
    "Fundamentals of Electrical Engineering": 3,
    "Computer-Aided Design": 3,
    # Year 2, Sem 2
    "Engineering Economics": 4,
    "Engineering Data Analysis": 4,
    "Differential Equations": 4,
    "Object Oriented Programming": 4,
    "Advanced Engineering Mathematics for CpE": 4,
    "Cognate/Elective Course 1": 4,
    "Electronic Circuits: Devices and Analysis": 4,
    "Basic Occupational Health and Safety": 4,
    "Numerical Methods": 4,
    "Kontekstwalisadong Komunikasyon sa Filipino": 4,
    # Year 3, Sem 1
    "Logic Circuits and Design": 5,
    "Data Structures and Algorithms": 5,
    "Introduction to Networks, Data and Digital Communications (CISCO 1)": 5,
    "Fundamentals of Mixed Signals and Sensors": 5,
    "Feedback and Control Systems": 5,
    "Introduction to HDL": 5,
    "Research Methods": 5,
    "Filipino sa Iba't Ibang Disiplina": 5,
    # Year 3, Sem 2
    "Microprocessors": 6,
    "Software Design": 6,
    "Routing and Switching (CISCO 2)": 6,
    "Digital Signal Processing": 6,
    "Emerging Technologies in CpE": 6,
    "CpE Practice and Design 1": 6,
    "Cognate/Elective Course 2": 6,
    # Year 4, Sem 1
    "Scaling Networks (CISCO 3)": 7,
    "Operating Systems": 7,
    "Computer Architecture and Organization": 7,
    "Computer Engineering Drafting and Design": 7,
    "Connecting Networks and Security (CISCO 4)": 7,
    "Embedded Systems": 7,
    "Seminars and Fieldtrips": 7,
    "Manufacturing and Quality Control": 7,
    "Cognate/Elective Course 3 (Data Mining / AI Track)": 7,
    "ASEAN Literature": 7,
    # Year 4, Sem 2
    "Technopreneurship": 8,
    "On-the-Job Training": 8,
    "CpE Practice and Design 2": 8,
}

# ILO weights: ILO1=knowledge, ILO2=comprehension, ILO3=application, ILO4=analysis/synthesis
ILO_WEIGHTS = np.array([0.25, 0.30, 0.25, 0.20])


def _get_profile(course: str) -> np.ndarray:
    """Return skill weight profile; fall back to mean profile for unknown courses."""
    if course in COURSE_PROFILES:
        return np.array(COURSE_PROFILES[course], dtype=float)
    all_profiles = np.array(list(COURSE_PROFILES.values()), dtype=float)
    return all_profiles.mean(axis=0)


def compute_skill_scores(
    course: str,
    ilo1: float,
    ilo2: float,
    ilo3: float,
    ilo4: float,
    noise_std: float = 5.0,
    rng: Optional[np.random.Generator] = None,
) -> Dict[str, float]:
    """
    Compute projected skill scores from a student's ILO performance in a course.
    noise_std > 0 adds realistic variability during training; set to 0 at inference.
    """
    profile  = _get_profile(course)
    ilo_avg  = float(ILO_WEIGHTS @ np.array([ilo1, ilo2, ilo3, ilo4], dtype=float))
    scores   = ilo_avg * profile

    if noise_std > 0:
        noise = (rng.normal(0, noise_std, len(SKILL_CATEGORIES))
                 if rng is not None
                 else np.random.normal(0, noise_std, len(SKILL_CATEGORIES)))
        noise *= (profile > 0.05).astype(float)
        scores = scores + noise

    return {skill: float(v) for skill, v in
            zip(SKILL_CATEGORIES, np.clip(scores, 0.0, 100.0))}


def ilo_weighted_avg(ilo1: float, ilo2: float, ilo3: float, ilo4: float) -> float:
    return float(ILO_WEIGHTS @ np.array([ilo1, ilo2, ilo3, ilo4], dtype=float))


def ilo_weighted_avg_for_course(
    course: str, ilo1: float, ilo2: float, ilo3: float, ilo4: float
) -> float:
    """
    Weighted ILO average using only the ILOs the course actually has.
    Weights are renormalized so a full-mastery 3-ILO course returns 100, not 80.
    """
    n = get_course_ilo_count(course)
    weights = ILO_WEIGHTS[:n]
    weights = weights / weights.sum()
    values  = np.array([ilo1, ilo2, ilo3, ilo4], dtype=float)[:n]
    return float(weights @ values)


# ── Course code lookup ────────────────────────────────────────────────────────
COURSE_CODE: Dict[str, str] = {
    "Introduction to Engineering":              "ENGG 401",
    "Understanding the Self":                   "GEd 101",
    "Mathematics in the Modern World":          "GEd 102",
    "Readings in Philippine History":           "GEd 105",
    "Purposive Communication":                  "GEd 106",
    "Differential Calculus":                    "MATH 401",
    "General Chemistry":                        "SCl 401",
    "Computer Programming 1":                   "CpE 401",
    "Engineering Drawing":                      "ENGG 402",
    "Contemporary World":                       "GEd 104",
    "Art Appreciation":                         "GEd 108",
    "Science, Technology and Society":          "GEd 109",
    "Integral Calculus":                        "MATH 402",
    "Physics 1":                                "SCI 403",
    "Life and Works of Rizal":                  "GEd 103",
    "Ethics":                                   "GEd 107",
    "Modern Biology":                           "SCI 402",
    "Computer Engineering as a Discipline":     "CpE 403",
    "Programming Logic and Design":             "CpE 404",
    "Discrete Mathematics":                     "CpE 405",
    "Fundamentals of Electrical Engineering":   "EE 423",
    "Computer-Aided Design":                    "ENGG 403",
    "Engineering Economics":                    "ENGG 404",
    "Engineering Data Analysis":                "MATH 403",
    "Differential Equations":                   "MATH 404",
    "Object Oriented Programming":              "CpE 406",
    "Advanced Engineering Mathematics for CpE": "CpE 408",
    "Cognate/Elective Course 1":                "CpEE 401",
    "Electronic Circuits: Devices and Analysis":"ECE 421",
    "Basic Occupational Health and Safety":     "ENGG 411",
    "Numerical Methods":                        "ENGG 414",
    "Kontekstwalisadong Komunikasyon sa Filipino": "Fili 101",
    "Logic Circuits and Design":                "CpE 410",
    "Data Structures and Algorithms":           "CpE 411",
    "Introduction to Networks, Data and Digital Communications (CISCO 1)": "CpE 412",
    "Fundamentals of Mixed Signals and Sensors":"CpE 413",
    "Feedback and Control Systems":             "CpE 414",
    "Introduction to HDL":                      "CpE 415",
    "Research Methods":                         "ENGG 416",
    "Filipino sa Iba't Ibang Disiplina":        "Fili 102",
    "Microprocessors":                          "CpE 417",
    "Software Design":                          "CpE 418",
    "Routing and Switching (CISCO 2)":          "CpE 419",
    "Digital Signal Processing":                "CpE 420",
    "Emerging Technologies in CpE":             "CpE 421",
    "CpE Practice and Design 1":                "CpE 422",
    "Cognate/Elective Course 2":                "CpEE 402",
    "Scaling Networks (CISCO 3)":               "CpE 423",
    "Operating Systems":                        "CpE 424",
    "Computer Architecture and Organization":   "CpE 425",
    "Computer Engineering Drafting and Design": "CpE 426",
    "Connecting Networks and Security (CISCO 4)": "CpE 427",
    "Embedded Systems":                         "CpE 428",
    "Seminars and Fieldtrips":                  "CpE 429",
    "Manufacturing and Quality Control":        "IE 424",
    "Cognate/Elective Course 3 (Data Mining / AI Track)": "CpEE 403",
    "ASEAN Literature":                         "Litr 102",
    "Technopreneurship":                        "ENGG 405",
    "On-the-Job Training":                      "ENGG 417",
    "CpE Practice and Design 2":                "CpE 430",
}


def get_course_code(course: str) -> str:
    return COURSE_CODE.get(course, "")


# ── ILO count per course (from courses_note.md) ───────────────────────────────
# Most courses have 3 ILOs; some STEM/technical ones have 4; Contemporary World has 2.
COURSE_ILO_COUNT: Dict[str, int] = {
    # Year 1, Sem 1
    "Differential Calculus": 4,
    "General Chemistry": 4,
    "Introduction to Engineering": 3,
    "Mathematics in the Modern World": 3,
    "Purposive Communication": 3,
    "Readings in Philippine History": 3,
    "Understanding the Self": 3,
    # Year 1, Sem 2
    "Art Appreciation": 3,
    "Computer Programming 1": 4,
    "Contemporary World": 2,
    "Engineering Drawing": 3,
    "Integral Calculus": 3,
    "Physics 1": 3,
    "Science, Technology and Society": 3,
    # Year 1, Sem 3
    "Ethics": 3,
    "Life and Works of Rizal": 3,
    "Modern Biology": 3,
    # Year 2, Sem 1
    "Computer Engineering as a Discipline": 3,
    "Computer-Aided Design": 3,
    "Differential Equations": 3,
    "Discrete Mathematics": 4,
    "Engineering Data Analysis": 3,
    "Engineering Economics": 4,
    "Fundamentals of Electrical Engineering": 3,
    "Programming Logic and Design": 4,
    # Year 2, Sem 2
    "Advanced Engineering Mathematics for CpE": 4,
    "Basic Occupational Health and Safety": 4,
    "Cognate/Elective Course 1": 4,
    "Electronic Circuits: Devices and Analysis": 3,
    "Kontekstwalisadong Komunikasyon sa Filipino": 3,
    "Numerical Methods": 4,
    "Object Oriented Programming": 4,
    # Year 3, Sem 1
    "Data Structures and Algorithms": 3,
    "Introduction to Networks, Data and Digital Communications (CISCO 1)": 3,
    "Feedback and Control Systems": 3,
    "Filipino sa Iba't Ibang Disiplina": 3,
    "Fundamentals of Mixed Signals and Sensors": 3,
    "Introduction to HDL": 3,
    "Logic Circuits and Design": 3,
    "Research Methods": 3,
    # Year 3, Sem 2
    "Cognate/Elective Course 2": 4,
    "CpE Practice and Design 1": 4,
    "Digital Signal Processing": 4,
    "Emerging Technologies in CpE": 4,
    "Microprocessors": 4,
    "Routing and Switching (CISCO 2)": 4,
    "Software Design": 4,
    # Year 3, Sem 3
    "Computer Architecture and Organization": 3,
    "Operating Systems": 3,
    "Scaling Networks (CISCO 3)": 3,
    # Year 4, Sem 1
    "ASEAN Literature": 3,
    "Cognate/Elective Course 3 (Data Mining / AI Track)": 3,
    "Computer Engineering Drafting and Design": 3,
    "Connecting Networks and Security (CISCO 4)": 4,
    "Embedded Systems": 3,
    "Manufacturing and Quality Control": 3,
    "Seminars and Fieldtrips": 3,
    # Year 4, Sem 2
    "CpE Practice and Design 2": 4,
    "On-the-Job Training": 3,
    "Technopreneurship": 3,
}


def get_course_ilo_count(course: str) -> int:
    return COURSE_ILO_COUNT.get(course, 4)


def map_avg_to_outcome(avg: float) -> str:
    x = float(avg)
    if x < 75:   return "Failure"
    if x < 78:   return "Passing"
    if x < 80:   return "Fairly Satisfactory"
    if x < 82:   return "Satisfactory"
    if x < 85:   return "Very Satisfactory"
    if x < 88:   return "Meritorious"
    if x < 91:   return "Good"
    return "Very Good"
