"""
Deterministic subject → skill mapping for BSU CpE curriculum.
Derived from BSCpE_ILO_Skillset_Alignment.xlsx — Skillset Reference sheet.
Used by Agent 2 (Academic Analyzer) instead of LLM guessing.
"""

SUBJECT_SKILL_MAP = {
    # ── Programming & Software Development ──────────────────────────
    "Computer Programming 1": {
        "primary_skills": ["Programming Fundamentals", "Problem Solving", "Algorithm Design"],
        "skillset_categories": ["Programming & Software Development"],
        "abet_sos": ["SO1", "SO5", "SO11"],
        "career_relevance": ["Backend Developer", "Full Stack Developer", "Software Architect"]
    },
    "Programming Logic and Design": {
        "primary_skills": ["Algorithm Design", "Logic Formulation", "Programming Fundamentals"],
        "skillset_categories": ["Programming & Software Development"],
        "abet_sos": ["SO1", "SO5"],
        "career_relevance": ["Backend Developer", "Full Stack Developer"]
    },
    "Object Oriented Programming": {
        "primary_skills": ["OOP", "Software Design Patterns", "Python", "Java"],
        "skillset_categories": ["Programming & Software Development"],
        "abet_sos": ["SO1", "SO5", "SO11"],
        "career_relevance": ["Backend Developer", "Full Stack Developer", "Software Architect"]
    },
    "Data Structures and Algorithms": {
        "primary_skills": ["Algorithm Design", "Data Structures", "Computational Thinking"],
        "skillset_categories": ["Programming & Software Development", "Mathematics & Science Foundations"],
        "abet_sos": ["SO1", "SO5"],
        "career_relevance": ["Backend Developer", "Software Architect", "AI Engineer"]
    },
    "Software Design": {
        "primary_skills": ["Software Architecture", "Design Patterns", "SOLID Principles", "UML"],
        "skillset_categories": ["Programming & Software Development", "Engineering Design & Research"],
        "abet_sos": ["SO1", "SO3", "SO5", "SO11"],
        "career_relevance": ["Software Architect", "Backend Developer", "Full Stack Developer"]
    },
    "Discrete Mathematics": {
        "primary_skills": ["Mathematical Logic", "Set Theory", "Graph Theory", "Combinatorics"],
        "skillset_categories": ["Mathematics & Science Foundations", "Programming & Software Development"],
        "abet_sos": ["SO1", "SO5"],
        "career_relevance": ["AI Engineer", "Data Scientist", "Software Architect"]
    },

    # ── Mathematics & Science Foundations ───────────────────────────
    "Differential Calculus": {
        "primary_skills": ["Calculus", "Mathematical Analysis", "Quantitative Reasoning"],
        "skillset_categories": ["Mathematics & Science Foundations"],
        "abet_sos": ["SO1"],
        "career_relevance": ["Data Scientist", "AI Engineer", "Machine Learning Engineer"]
    },
    "Integral Calculus": {
        "primary_skills": ["Calculus", "Mathematical Analysis", "Numerical Integration"],
        "skillset_categories": ["Mathematics & Science Foundations"],
        "abet_sos": ["SO1"],
        "career_relevance": ["Data Scientist", "AI Engineer", "Machine Learning Engineer"]
    },
    "Differential Equations": {
        "primary_skills": ["Differential Equations", "Mathematical Modeling", "Numerical Methods"],
        "skillset_categories": ["Mathematics & Science Foundations"],
        "abet_sos": ["SO1"],
        "career_relevance": ["Data Scientist", "Machine Learning Engineer"]
    },
    "Engineering Data Analysis": {
        "primary_skills": ["Statistics", "Data Analysis", "Probability", "Statistical Modeling"],
        "skillset_categories": ["Mathematics & Science Foundations", "Data Science & AI/ML"],
        "abet_sos": ["SO1", "SO2"],
        "career_relevance": ["Data Scientist", "AI Engineer", "Machine Learning Engineer"]
    },
    "Advanced Engineering Mathematics for CpE": {
        "primary_skills": ["Advanced Mathematics", "Linear Algebra", "Complex Analysis"],
        "skillset_categories": ["Mathematics & Science Foundations"],
        "abet_sos": ["SO1"],
        "career_relevance": ["AI Engineer", "Machine Learning Engineer", "Data Scientist"]
    },
    "Numerical Methods": {
        "primary_skills": ["Numerical Analysis", "Computational Methods", "Python for Scientific Computing"],
        "skillset_categories": ["Mathematics & Science Foundations", "Data Science & AI/ML"],
        "abet_sos": ["SO1", "SO5", "SO11"],
        "career_relevance": ["Data Scientist", "AI Engineer", "Machine Learning Engineer"]
    },
    "Mathematics in the Modern World": {
        "primary_skills": ["Mathematical Reasoning", "Problem Solving", "Quantitative Literacy"],
        "skillset_categories": ["Mathematics & Science Foundations"],
        "abet_sos": ["SO1"],
        "career_relevance": ["Data Scientist", "AI Engineer"]
    },

    # ── Networking & Communications ──────────────────────────────────
    "Introduction to Networks, Data and Digital Communications (CISCO 1)": {
        "primary_skills": ["Networking Fundamentals", "TCP/IP", "OSI Model", "LAN Design"],
        "skillset_categories": ["Networking & Communications"],
        "abet_sos": ["SO1", "SO2", "SO3", "SO5", "SO11"],
        "career_relevance": ["DevOps Engineer", "Cybersecurity Analyst", "Network Engineer"]
    },
    "Routing and Switching (CISCO 2)": {
        "primary_skills": ["Routing Protocols", "VLANs", "Switching", "OSPF"],
        "skillset_categories": ["Networking & Communications"],
        "abet_sos": ["SO1", "SO2", "SO3", "SO5", "SO11"],
        "career_relevance": ["DevOps Engineer", "Cybersecurity Analyst", "Network Engineer"]
    },
    "Scaling Networks (CISCO 3)": {
        "primary_skills": ["Advanced Routing", "EIGRP", "BGP", "Network Scaling"],
        "skillset_categories": ["Networking & Communications"],
        "abet_sos": ["SO1", "SO2", "SO3", "SO5", "SO11"],
        "career_relevance": ["DevOps Engineer", "Cybersecurity Analyst"]
    },
    "Connecting Networks and Security (CISCO 4)": {
        "primary_skills": ["Network Security", "VPN", "Firewall", "Security Protocols"],
        "skillset_categories": ["Networking & Communications", "Operating Systems & Architecture"],
        "abet_sos": ["SO1", "SO2", "SO3", "SO5", "SO6", "SO11"],
        "career_relevance": ["Cybersecurity Analyst", "DevOps Engineer"]
    },

    # ── Operating Systems & Architecture ─────────────────────────────
    "Operating Systems": {
        "primary_skills": ["OS Concepts", "Process Management", "Memory Management", "Linux"],
        "skillset_categories": ["Operating Systems & Architecture"],
        "abet_sos": ["SO1", "SO5", "SO11"],
        "career_relevance": ["DevOps Engineer", "Backend Developer", "Software Architect"]
    },
    "Computer Architecture and Organization": {
        "primary_skills": ["CPU Architecture", "Memory Hierarchy", "Assembly Language", "Pipelining"],
        "skillset_categories": ["Operating Systems & Architecture"],
        "abet_sos": ["SO1", "SO5"],
        "career_relevance": ["Embedded Systems Engineer", "Software Architect"]
    },

    # ── Hardware & Circuit Design ────────────────────────────────────
    "Fundamentals of Electrical Engineering": {
        "primary_skills": ["Circuit Analysis", "Electrical Fundamentals", "Ohm's Law", "AC/DC Circuits"],
        "skillset_categories": ["Hardware & Circuit Design"],
        "abet_sos": ["SO1", "SO3", "SO11"],
        "career_relevance": ["Embedded Systems Engineer"]
    },
    "Electronic Circuits: Devices and Analysis": {
        "primary_skills": ["Electronic Devices", "Circuit Design", "Transistors", "Amplifiers"],
        "skillset_categories": ["Hardware & Circuit Design"],
        "abet_sos": ["SO1", "SO3", "SO11"],
        "career_relevance": ["Embedded Systems Engineer"]
    },
    "Logic Circuits and Design": {
        "primary_skills": ["Digital Logic", "Boolean Algebra", "Logic Gates", "Circuit Design"],
        "skillset_categories": ["Hardware & Circuit Design"],
        "abet_sos": ["SO1", "SO3", "SO11"],
        "career_relevance": ["Embedded Systems Engineer", "Software Architect"]
    },
    "Introduction to HDL": {
        "primary_skills": ["Verilog", "FPGA", "Digital Design", "HDL Programming"],
        "skillset_categories": ["Hardware & Circuit Design"],
        "abet_sos": ["SO1", "SO3", "SO11"],
        "career_relevance": ["Embedded Systems Engineer"]
    },
    "Computer Engineering Drafting and Design": {
        "primary_skills": ["CAD", "Engineering Drawing", "System Design", "Prototyping"],
        "skillset_categories": ["Hardware & Circuit Design", "Engineering Design & Research"],
        "abet_sos": ["SO1", "SO3"],
        "career_relevance": ["Embedded Systems Engineer"]
    },

    # ── Embedded & Microprocessor Systems ───────────────────────────
    "Microprocessors": {
        "primary_skills": ["Microprocessor Architecture", "Assembly Language", "Embedded C", "Interfacing"],
        "skillset_categories": ["Embedded & Microprocessor Systems"],
        "abet_sos": ["SO1", "SO3", "SO5", "SO11"],
        "career_relevance": ["Embedded Systems Engineer", "IoT Developer"]
    },
    "Embedded Systems": {
        "primary_skills": ["RTOS", "Embedded C", "Sensor Integration", "Firmware Development"],
        "skillset_categories": ["Embedded & Microprocessor Systems"],
        "abet_sos": ["SO1", "SO3", "SO5", "SO11"],
        "career_relevance": ["Embedded Systems Engineer", "IoT Developer"]
    },
    "Fundamentals of Mixed Signals and Sensors": {
        "primary_skills": ["Sensor Technology", "Signal Conditioning", "ADC/DAC", "IoT Basics"],
        "skillset_categories": ["Embedded & Microprocessor Systems", "Signal Processing & Control Systems"],
        "abet_sos": ["SO1", "SO2", "SO3"],
        "career_relevance": ["Embedded Systems Engineer", "IoT Developer"]
    },

    # ── Signal Processing & Control Systems ─────────────────────────
    "Feedback and Control Systems": {
        "primary_skills": ["Control Theory", "PID Control", "System Modeling", "Stability Analysis"],
        "skillset_categories": ["Signal Processing & Control Systems"],
        "abet_sos": ["SO1", "SO2", "SO5"],
        "career_relevance": ["Embedded Systems Engineer", "Robotics Engineer"]
    },
    "Digital Signal Processing": {
        "primary_skills": ["DSP Algorithms", "Filter Design", "FFT", "Signal Analysis"],
        "skillset_categories": ["Signal Processing & Control Systems"],
        "abet_sos": ["SO1", "SO2", "SO5"],
        "career_relevance": ["Signal Processing Engineer", "AI Engineer"]
    },

    # ── Data Science & AI/ML ─────────────────────────────────────────
    "Cognate/Elective Course 3 (Data Mining / AI Track)": {
        "primary_skills": ["Machine Learning", "Data Mining", "Python for ML", "scikit-learn"],
        "skillset_categories": ["Data Science & AI/ML", "Programming & Software Development"],
        "abet_sos": ["SO1", "SO2", "SO3", "SO5"],
        "career_relevance": ["Data Scientist", "AI Engineer", "Machine Learning Engineer"]
    },

    # ── Engineering Design & Research ───────────────────────────────
    "CpE Practice and Design 1": {
        "primary_skills": ["System Design", "Project Management", "Research Methodology", "Prototyping"],
        "skillset_categories": ["Engineering Design & Research", "Programming & Software Development"],
        "abet_sos": ["SO1", "SO2", "SO3", "SO4", "SO5", "SO12"],
        "career_relevance": ["Software Architect", "Full Stack Developer"]
    },
    "CpE Practice and Design 2": {
        "primary_skills": ["Capstone Design", "Full System Implementation", "Technical Documentation"],
        "skillset_categories": ["Engineering Design & Research", "Programming & Software Development"],
        "abet_sos": ["SO1", "SO2", "SO3", "SO4", "SO5", "SO6", "SO7", "SO12", "SO13"],
        "career_relevance": ["Software Architect", "Full Stack Developer", "Backend Developer"]
    },
    "Research Methods": {
        "primary_skills": ["Research Methodology", "Technical Writing", "Literature Review"],
        "skillset_categories": ["Engineering Design & Research"],
        "abet_sos": ["SO1", "SO2", "SO7"],
        "career_relevance": ["AI Engineer", "Data Scientist"]
    },
    "Computer Engineering as a Discipline": {
        "primary_skills": ["Engineering Ethics", "CpE Overview", "Professional Practice"],
        "skillset_categories": ["Engineering Design & Research", "Modern Engineering Tools"],
        "abet_sos": ["SO3", "SO6", "SO10"],
        "career_relevance": ["All careers"]
    },
    "Introduction to Engineering": {
        "primary_skills": ["Engineering Design Process", "Teamwork", "Ethics", "Prototyping"],
        "skillset_categories": ["Engineering Design & Research"],
        "abet_sos": ["SO3", "SO5", "SO10", "SO11", "SO13"],
        "career_relevance": ["All careers"]
    },

    # ── Modern Engineering Tools ─────────────────────────────────────
    "Computer-Aided Design": {
        "primary_skills": ["AutoCAD", "CAD Software", "Engineering Drawing", "3D Modeling"],
        "skillset_categories": ["Modern Engineering Tools"],
        "abet_sos": ["SO11"],
        "career_relevance": ["Embedded Systems Engineer"]
    },
    "Emerging Technologies in CpE": {
        "primary_skills": ["IoT", "Cloud Computing", "AI Trends", "Industry 4.0"],
        "skillset_categories": ["Modern Engineering Tools", "Data Science & AI/ML"],
        "abet_sos": ["SO11"],
        "career_relevance": ["AI Engineer", "DevOps Engineer", "Full Stack Developer"]
    },

    # ── Professional Skills ──────────────────────────────────────────
    "Engineering Economics": {
        "primary_skills": ["Cost Analysis", "Project Economics", "ROI", "Budget Planning"],
        "skillset_categories": ["Project Management"],
        "abet_sos": ["SO12"],
        "career_relevance": ["Software Architect", "Engineering Manager"]
    },
    "Technopreneurship": {
        "primary_skills": ["Entrepreneurship", "Business Planning", "Tech Startup", "Innovation"],
        "skillset_categories": ["Entrepreneurial Mindset", "Project Management"],
        "abet_sos": ["SO3", "SO4", "SO7", "SO8", "SO13"],
        "career_relevance": ["Full Stack Developer", "Software Architect"]
    },
    "On-the-Job Training": {
        "primary_skills": ["Professional Practice", "Industry Experience", "Communication"],
        "skillset_categories": ["Communication", "Ethics & Professionalism"],
        "abet_sos": ["SO6", "SO7", "SO9", "SO10", "SO13"],
        "career_relevance": ["All careers"]
    },
    "Seminars and Fieldtrips": {
        "primary_skills": ["Industry Awareness", "Professional Networking", "Lifelong Learning"],
        "skillset_categories": ["Lifelong Learning", "Cultural & Global Competence"],
        "abet_sos": ["SO9", "SO10"],
        "career_relevance": ["All careers"]
    },
}

# Fuzzy match helper — handles slight name variations
def get_subject_skills(subject_name: str) -> dict:
    """
    Look up skills for a subject name.
    First tries exact match, then partial match.
    Returns empty dict if no match found.
    """
    if not subject_name:
        return {}

    # Exact match
    if subject_name in SUBJECT_SKILL_MAP:
        return SUBJECT_SKILL_MAP[subject_name]

    # Partial match — find best match
    subject_lower = subject_name.lower()
    for key in SUBJECT_SKILL_MAP:
        if key.lower() in subject_lower or subject_lower in key.lower():
            return SUBJECT_SKILL_MAP[key]

    # Keyword match — fallback
    keywords = {
        "programming": "Object Oriented Programming",
        "network": "Introduction to Networks, Data and Digital Communications (CISCO 1)",
        "data structure": "Data Structures and Algorithms",
        "algorithm": "Data Structures and Algorithms",
        "operating system": "Operating Systems",
        "machine learning": "Cognate/Elective Course 3 (Data Mining / AI Track)",
        "database": "Software Design",
        "embedded": "Embedded Systems",
        "microprocessor": "Microprocessors",
        "calculus": "Differential Calculus",
        "signal": "Digital Signal Processing",
        "circuit": "Logic Circuits and Design",
    }
    for keyword, mapped_subject in keywords.items():
        if keyword in subject_lower:
            return SUBJECT_SKILL_MAP[mapped_subject]

    return {}


def build_subject_skill_context(enrolled_subjects: list[str]) -> str:
    """
    Pre-build the skill context string to inject into Agent 2's task.
    This replaces LLM guessing with deterministic lookups.
    """
    if not enrolled_subjects:
        return "No subjects enrolled yet."

    lines = []
    for subject in enrolled_subjects:
        mapping = get_subject_skills(subject)
        if mapping:
            skills = ", ".join(mapping["primary_skills"])
            cats = ", ".join(mapping["skillset_categories"])
            sos = ", ".join(mapping.get("abet_sos", []))
            lines.append(
                f"Subject: {subject}\n"
                f"  Primary skills: {skills}\n"
                f"  BSCpE categories: {cats}\n"
                f"  ABET Student Outcomes: {sos or 'unspecified'}\n"
                f"  Career relevance: {', '.join(mapping['career_relevance'])}"
            )
        else:
            lines.append(f"Subject: {subject}\n  Skills: General engineering competency")
    return "\n\n".join(lines)
