"""
seed_knowledge.py — One-time script to embed and insert knowledge documents into pgvector.

Run from the backend directory:
    python scripts/seed_knowledge.py

This populates the knowledge_chunks table with:
  - 10 CPE career path documents (hardcoded)
  - N Skillset Definitions parsed from 'Skillset Explanations' xlsx tab
  - 60 BSCpE course documents parsed from the main ILO-Skillset Alignment xlsx tab,
    with ABET SO codes expanded inline to their full definitions from the 'SO Legend' tab.

NOTE: CURRICULUM_DOCUMENTS and ILO_DOCUMENTS are intentionally removed.
  The Excel spreadsheet already contains this data at a higher fidelity.
  GitHub activity and side projects are the primary career-matching signal.
"""
import sys
import os
import time
from pathlib import Path

import pandas as pd

# Add backend root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import DATABASE_URL
from app.ai.embeddings import embed_text

# Sync engine
_sync_url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
engine = create_engine(_sync_url)

# ─── Knowledge Documents ──────────────────────────────────────────────────────

CAREER_PATHS = [
    {
        "title": "Embedded Systems Engineer",
        "content": (
            "Career: Embedded Systems Engineer | Sector: Hardware / IoT\n"
            "Core skills: C, C++, Microcontrollers, RTOS, ARM Architecture, Circuit Design, "
            "Debugging Tools, I2C, SPI, UART protocols.\n"
            "Nice to have: Rust, Verilog, PCB Design, Linux Kernel.\n"
            "Description: Designs and programs firmware for embedded devices and "
            "microcontroller-based systems. Works at the intersection of hardware and software."
        ),
    },
    {
        "title": "IoT Solutions Engineer",
        "content": (
            "Career: IoT Solutions Engineer | Sector: IoT / Cloud\n"
            "Core skills: Embedded C, MQTT, Python, Cloud Platforms (AWS IoT / Azure IoT), "
            "Sensor Integration, Networking Protocols, Edge Computing.\n"
            "Nice to have: Docker, Node-RED, TinyML, LoRaWAN.\n"
            "Description: Builds end-to-end IoT systems connecting hardware sensors to "
            "cloud analytics pipelines."
        ),
    },
    {
        "title": "FPGA / Hardware Design Engineer",
        "content": (
            "Career: FPGA / Hardware Design Engineer | Sector: Semiconductor / Hardware\n"
            "Core skills: Verilog, VHDL, FPGA Development, Digital Logic Design, "
            "Timing Analysis, Simulation Tools, SystemVerilog.\n"
            "Nice to have: ASIC Design, High-Level Synthesis, PCB Layout, Signal Processing.\n"
            "Description: Designs and verifies digital circuits using HDLs and FPGA platforms."
        ),
    },
    {
        "title": "Network Engineer",
        "content": (
            "Career: Network Engineer | Sector: Telecommunications / IT\n"
            "Core skills: TCP/IP, Routing & Switching, Network Security, Linux Administration, "
            "Firewall Configuration, VLAN/Subnetting, Wireshark.\n"
            "Nice to have: SDN, Python Scripting, Cloud Networking, CCNA/CCNP.\n"
            "Description: Designs, deploys, and maintains enterprise and telecommunications networks."
        ),
    },
    {
        "title": "Cybersecurity Engineer",
        "content": (
            "Career: Cybersecurity Engineer | Sector: Security\n"
            "Core skills: Network Security, Penetration Testing, SIEM Tools, "
            "Cryptography, Linux, Incident Response, Vulnerability Assessment.\n"
            "Nice to have: Python, Reverse Engineering, Cloud Security, Compliance Frameworks.\n"
            "Description: Protects systems and networks from security threats through proactive defense."
        ),
    },
    {
        "title": "Software Engineer",
        "content": (
            "Career: Software Engineer | Sector: Software / Tech\n"
            "Core skills: Data Structures & Algorithms, Python, JavaScript, TypeScript, "
            "Git, REST APIs, SQL, Software Design Patterns.\n"
            "Nice to have: React, Node.js, Docker, CI/CD, Cloud Services, System Design.\n"
            "Description: Designs and builds software applications across the full stack."
        ),
    },
    {
        "title": "Machine Learning Engineer",
        "content": (
            "Career: Machine Learning Engineer | Sector: AI / Data Science\n"
            "Core skills: Python, Machine Learning Algorithms, TensorFlow, PyTorch, "
            "Data Preprocessing, Linear Algebra, Statistics, Model Evaluation.\n"
            "Nice to have: Deep Learning, NLP, Computer Vision, MLOps, Cloud ML Services.\n"
            "Description: Develops and deploys machine learning models for real-world applications."
        ),
    },
    {
        "title": "Robotics Engineer",
        "content": (
            "Career: Robotics Engineer | Sector: Robotics / Automation\n"
            "Core skills: C, C++, ROS, Control Systems, Sensor Fusion, "
            "Kinematics, Embedded Systems, Python.\n"
            "Nice to have: Computer Vision, SLAM, PLC Programming, Simulation using Gazebo.\n"
            "Description: Designs and programs robotic systems combining hardware and software."
        ),
    },
    {
        "title": "Telecommunications Engineer",
        "content": (
            "Career: Telecommunications Engineer | Sector: Telecommunications\n"
            "Core skills: Signal Processing, RF Engineering, Antenna Design, "
            "Communication Protocols, MATLAB, Network Planning, 5G, LTE.\n"
            "Nice to have: Python, SDR, Fiber Optics, Satellite Communications.\n"
            "Description: Designs and optimizes communication systems and signal transmission infrastructure."
        ),
    },
    {
        "title": "DevOps / Cloud Engineer",
        "content": (
            "Career: DevOps / Cloud Engineer | Sector: Cloud / Infrastructure\n"
            "Core skills: Linux, Docker, CI/CD Pipelines, Cloud Platforms (AWS, GCP, Azure), "
            "Infrastructure as Code, Monitoring & Logging, Git.\n"
            "Nice to have: Kubernetes, Terraform, Ansible, Python, Bash Scripting.\n"
            "Description: Automates infrastructure, deployments, and operations for scalable cloud systems."
        ),
    },
]

# ─── BSCpE ILO–Skillset Alignment (parsed from xlsx) ─────────────────────────

XLSX_PATH = Path(__file__).resolve().parent.parent / "Documents" / "BSCpE_ILO_Skillset_Alignment.xlsx"


def _load_so_lookup() -> dict:
    """
    Internal helper — loads the 'SO Legend' tab and returns a dict:
        { "SO3": ("Design/Dev. of Solutions", "Design solutions/systems/..."), ... }

    Used by _parse_ilo_alignment_xlsx to expand bare SO codes inline so the AI
    sees human-readable definitions rather than opaque 'SO3 (I)' labels.
    """
    df = pd.read_excel(XLSX_PATH, sheet_name='SO Legend', skiprows=1)
    lookup = {}
    for _, row in df.dropna(how='all').iterrows():
        code = str(row.iloc[0]).strip()
        name = str(row.iloc[1]).strip()
        desc = str(row.iloc[2]).strip()
        if code and code != 'nan':
            lookup[code] = (name, desc)
    return lookup

def _parse_skillsets() -> list[dict]:
    """Parse the 'Skillset Reference' sheet for specific technical/professional skills."""
    df = pd.read_excel(XLSX_PATH, sheet_name='Skillset Reference', skiprows=1)
    docs = []
    for _, row in df.dropna(how='all').iterrows():
        domain = str(row.iloc[0]).strip()
        skill = str(row.iloc[1]).strip()
        sos = str(row.iloc[2]).strip()
        desc = str(row.iloc[3]).strip()
        if skill and skill != 'nan' and domain not in ('Category', 'nan'):
            docs.append({
                "title": f"Skillset Definition: {skill} ({domain})",
                "content": (
                    f"Skill Domain: {domain}\nSkillset Name: {skill}\n"
                    f"Mapped ABET SOs: {sos}\nDescription & Keywords: {desc}\n"
                    f"This defines specific abilities evaluated in technical engineering courses."
                )
            })
    return docs


def _parse_ilo_alignment_xlsx() -> list[dict]:
    """
    Parse the ILO-Skillset Alignment xlsx into one document per subject.

    SO codes in column E (e.g. 'SO3 (I)  SO5 (R)') are expanded inline
    using the SO Legend tab so the AI sees full English definitions, not
    opaque codes.

    The xlsx layout repeats this block per subject:
      - Row A (col0): "  CODE  ·  Subject Name"
      - Row B (col0): SO summary line
      - Rows C+ (col2-6): ILO number, statement, mapped SOs, tech skills, prof skills
      - Blank row separator
    """
    df = pd.read_excel(XLSX_PATH, header=None)
    so_lookup = _load_so_lookup()  # { "SO3": ("Design/Dev. of Solutions", "..."), ... }

    import re

    def _expand_sos(raw: str) -> str:
        """Replace 'SO3 (I)' with 'SO3-Design/Dev. of Solutions [Introduced] — <definition>'"""
        level_map = {"I": "Introduced", "R": "Reinforced", "D": "Demonstrated", "I/R": "Introduced/Reinforced"}
        parts = []
        for token in re.findall(r'SO\d+\s*\([^)]+\)', raw):
            m = re.match(r'(SO\d+)\s*\(([^)]+)\)', token)
            if m:
                code, level = m.group(1), m.group(2).strip()
                level_label = level_map.get(level, level)
                if code in so_lookup:
                    name, desc = so_lookup[code]
                    parts.append(f"{code} [{level_label}]: {name} — {desc}")
                else:
                    parts.append(f"{code} [{level_label}]")
        return "\n    ".join(parts) if parts else raw

    subjects: list[dict] = []
    current_subject = None

    for i in range(df.shape[0]):
        col0 = df.iloc[i, 0]

        # Detect subject header: "  CODE  ·  Subject Name"
        if pd.notna(col0) and "·" in str(col0):
            if current_subject and current_subject["ilos"]:
                subjects.append(current_subject)
            parts = str(col0).strip().split("·", 1)
            current_subject = {
                "code": parts[0].strip(),
                "name": parts[1].strip() if len(parts) > 1 else parts[0].strip(),
                "ilos": [],
            }
            continue

        # Detect ILO data row: col2 has "ILO N"
        col2 = df.iloc[i, 2]
        if current_subject and pd.notna(col2) and str(col2).strip().startswith("ILO"):
            ilo_num = str(col2).strip()
            statement = str(df.iloc[i, 3]).strip() if pd.notna(df.iloc[i, 3]) else ""
            mapped_sos = str(df.iloc[i, 4]).strip() if pd.notna(df.iloc[i, 4]) else ""
            tech_skills = str(df.iloc[i, 5]).strip() if pd.notna(df.iloc[i, 5]) else ""
            prof_skills = str(df.iloc[i, 6]).strip() if pd.notna(df.iloc[i, 6]) else ""
            current_subject["ilos"].append({
                "num": ilo_num,
                "statement": statement,
                "mapped_sos": _expand_sos(mapped_sos),
                "tech_skills": tech_skills,
                "prof_skills": prof_skills,
            })

    # Don't forget the last subject
    if current_subject and current_subject["ilos"]:
        subjects.append(current_subject)

    # Build one document per subject
    docs: list[dict] = []
    for subj in subjects:
        title = f"BSCpE Curriculum: {subj['code']} — {subj['name']}"
        lines = [
            f"Course: {subj['name']} | Code: {subj['code']} | BatStateU BSCpE",
            "",
        ]
        for ilo in subj["ilos"]:
            lines.append(f"{ilo['num']}: {ilo['statement']}")
            lines.append(f"  Mapped Student Outcomes:\n    {ilo['mapped_sos']}")
            if ilo["tech_skills"] and ilo["tech_skills"] != "—":
                skills = ilo["tech_skills"].replace("✓ ", "").replace("* ", "").replace("\n", ", ")
                lines.append(f"  Technical Skills: {skills}")
            if ilo["prof_skills"] and ilo["prof_skills"] != "—":
                skills = ilo["prof_skills"].replace("✓ ", "").replace("* ", "").replace("\n", ", ")
                lines.append(f"  Professional Skills: {skills}")
            lines.append("")

        docs.append({"title": title, "content": "\n".join(lines).strip()})

    return docs


# ─── Seeder Logic ─────────────────────────────────────────────────────────────

def seed_category(conn, category: str, docs: list[dict]):
    print(f"\n📚 Seeding {len(docs)} '{category}' documents...")
    for i, doc in enumerate(docs):
        text_to_embed = f"{doc['title']}\n\n{doc['content']}"
        print(f"  [{i+1}/{len(docs)}] Embedding: {doc['title'][:60]}...")

        try:
            embedding = embed_text(text_to_embed, task_type="retrieval_document")
        except Exception as e:
            print(f"  ⚠️  Embedding failed: {e}")
            continue

        conn.execute(text("""
            INSERT INTO knowledge_chunks (category, title, content, embedding)
            VALUES (:category, :title, :content, CAST(:embedding AS vector))
            ON CONFLICT DO NOTHING
        """), {
            "category": category,
            "title": doc["title"],
            "content": doc["content"],
            "embedding": str(embedding),
        })

        # Respect Gemini free-tier rate limits (60 requests/min)
        if (i + 1) % 10 == 0:
            print("  ⏳ Rate limit pause (1s)...")
            time.sleep(1)

    print(f"  ✅ Done seeding '{category}'")


def main():
    print("🚀 ASPIRE RAG Knowledge Seeder")
    print("=" * 50)

    with engine.begin() as conn:
        # Ensure table exists (create if not)
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS knowledge_chunks (
                id SERIAL PRIMARY KEY,
                category VARCHAR NOT NULL,
                title VARCHAR NOT NULL,
                content TEXT NOT NULL,
                embedding vector(768)
            )
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx
            ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 10)
        """))

        # Clear existing data for a clean reseed
        existing = conn.execute(text("SELECT COUNT(*) FROM knowledge_chunks")).scalar()
        if existing > 0:
            print(f"⚠️  Found {existing} existing chunks. Clearing for fresh seed...")
            conn.execute(text("TRUNCATE knowledge_chunks RESTART IDENTITY"))

        seed_category(conn, "career_path", CAREER_PATHS)

        # Skillset definitions from 'Skillset Explanations' tab
        skill_docs = _parse_skillsets()
        print(f"\n📄 Parsed {len(skill_docs)} Skillset Definitions from {XLSX_PATH.name}")
        seed_category(conn, "skillset", skill_docs)

        # 60 BSCpE course documents — SO codes expanded inline from 'SO Legend' tab
        bsu_docs = _parse_ilo_alignment_xlsx()
        print(f"\n📄 Parsed {len(bsu_docs)} subjects from {XLSX_PATH.name}")
        seed_category(conn, "bsu_curriculum", bsu_docs)

        total = conn.execute(text("SELECT COUNT(*) FROM knowledge_chunks")).scalar()

    print(f"\n✅ Seeding complete! {total} knowledge chunks now in pgvector.")
    print("   The RAG pipeline is ready to use.\n")


if __name__ == "__main__":
    main()
