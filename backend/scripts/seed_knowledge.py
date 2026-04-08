"""
seed_knowledge.py — One-time script to embed and insert knowledge documents into pgvector.

Run from the backend directory:
    python scripts/seed_knowledge.py

This populates the knowledge_chunks table with:
  - 10 CPE career path documents
  - 6 ABET ILO competency descriptions
  - 8 BatStateU CPE core curriculum subjects
"""
import sys
import os
import time

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

ILO_DOCUMENTS = [
    {
        "title": "ILO: Problem Solving & Engineering Design",
        "content": (
            "ABET/CHED ILO: Problem Solving and Engineering Design\n"
            "Students demonstrate ability to identify, formulate, and solve complex engineering "
            "problems by applying principles of engineering, science, and mathematics. "
            "Assessed through: design projects, laboratory exercises, case studies, "
            "and capstone research. Key competencies: analytical thinking, algorithm design, "
            "debugging, optimization, and creative solution development."
        ),
    },
    {
        "title": "ILO: Communication Skills",
        "content": (
            "ABET/CHED ILO: Communication Skills\n"
            "Students communicate effectively with a range of audiences through written reports, "
            "technical documentation, oral presentations, and team collaboration. "
            "Assessed through: lab reports, research papers, project presentations, "
            "and peer review exercises."
        ),
    },
    {
        "title": "ILO: Professional & Ethical Responsibility",
        "content": (
            "ABET/CHED ILO: Professional and Ethical Responsibility\n"
            "Students recognize ethical and professional responsibilities in engineering "
            "situations and make informed judgments considering the impact of engineering "
            "solutions in global and societal contexts. "
            "Assessed through: ethics case studies, written reflections, and professional conduct practicum."
        ),
    },
    {
        "title": "ILO: Teamwork & Project Management",
        "content": (
            "ABET/CHED ILO: Teamwork and Project Management\n"
            "Students function effectively as members and leaders of diverse engineering teams. "
            "Competencies include: agile methodologies, project planning, task delegation, "
            "conflict resolution, and progress monitoring. "
            "Assessed through: group projects, capstone team deliverables, and peer evaluation."
        ),
    },
    {
        "title": "ILO: Lifelong Learning & Inquiry",
        "content": (
            "ABET/CHED ILO: Lifelong Learning and Self-Directed Inquiry\n"
            "Students show ability to acquire and apply new knowledge as needed using "
            "appropriate learning strategies. Competencies include: independent research, "
            "self-paced online learning, reading technical literature, and skills adaptation. "
            "Assessed through: research proposals, literature reviews, and skill self-assessments."
        ),
    },
    {
        "title": "ILO: Technical Design & Systems Thinking",
        "content": (
            "ABET/CHED ILO: Technical Design and Systems Thinking\n"
            "Students design systems, components, or processes to meet desired specifications "
            "within realistic constraints such as economic, environmental, social, or safety factors. "
            "Competencies: circuit design, software architecture, systems integration, "
            "and prototype development. Assessed through: design labs and capstone engineering projects."
        ),
    },
]

CURRICULUM_DOCUMENTS = [
    {
        "title": "CPE Curriculum: Data Structures and Algorithms",
        "content": (
            "Course: Data Structures and Algorithms | BatStateU CPE Core\n"
            "Topics: Arrays, Linked Lists, Stacks, Queues, Trees, Graphs, Sorting, "
            "Searching, Dynamic Programming, Algorithm Complexity (Big-O).\n"
            "Skills developed: Problem decomposition, algorithmic thinking, code optimization.\n"
            "Mapped ILOs: Problem Solving, Engineering Design."
        ),
    },
    {
        "title": "CPE Curriculum: Digital Logic Design",
        "content": (
            "Course: Digital Logic Design | BatStateU CPE Core\n"
            "Topics: Boolean Algebra, Logic Gates, Combinational Circuits, Sequential Circuits, "
            "Flip-Flops, Counters, Registers, Hardware Description Languages (Verilog/VHDL).\n"
            "Skills developed: Hardware reasoning, circuit simulation, HDL programming.\n"
            "Mapped ILOs: Technical Design, Systems Thinking."
        ),
    },
    {
        "title": "CPE Curriculum: Microprocessors and Microcontrollers",
        "content": (
            "Course: Microprocessors and Microcontrollers | BatStateU CPE Core\n"
            "Topics: CPU Architecture, Assembly Language, Memory Systems, I/O Interfaces, "
            "Interrupts, DMA, ARM Cortex-M programming, Arduino, STM32.\n"
            "Skills developed: Low-level programming, hardware-software co-design, embedded C.\n"
            "Mapped ILOs: Technical Design, Problem Solving."
        ),
    },
    {
        "title": "CPE Curriculum: Operating Systems",
        "content": (
            "Course: Operating Systems | BatStateU CPE Core\n"
            "Topics: Process Management, Scheduling, Memory Management, Virtual Memory, "
            "File Systems, Synchronization, Deadlocks, Linux internals.\n"
            "Skills developed: Systems programming, bash scripting, OS-level debugging.\n"
            "Mapped ILOs: Problem Solving, Systems Thinking."
        ),
    },
    {
        "title": "CPE Curriculum: Computer Networks",
        "content": (
            "Course: Computer Networks | BatStateU CPE Core\n"
            "Topics: OSI Model, TCP/IP, Routing Protocols, Subnetting, DNS, HTTP, "
            "Network Security basics, Socket Programming, Wireless Protocols.\n"
            "Skills developed: Network configuration, protocol analysis, socket programming.\n"
            "Mapped ILOs: Technical Design, Communication Skills."
        ),
    },
    {
        "title": "CPE Curriculum: Software Engineering",
        "content": (
            "Course: Software Engineering | BatStateU CPE Core\n"
            "Topics: SDLC, Agile/Scrum, Requirements Analysis, UML Diagrams, "
            "Design Patterns, Testing Strategies, DevOps basics, Version Control (Git).\n"
            "Skills developed: Project management, team collaboration, documentation.\n"
            "Mapped ILOs: Teamwork, Professional Responsibility."
        ),
    },
    {
        "title": "CPE Curriculum: Signal Processing",
        "content": (
            "Course: Signals and Systems / Digital Signal Processing | BatStateU CPE\n"
            "Topics: Fourier Transform, Laplace Transform, Z-Transform, FIR/IIR Filters, "
            "Sampling Theorem, FFT, MATLAB/Python signal analysis.\n"
            "Skills developed: Mathematical modeling, frequency analysis, filter design.\n"
            "Mapped ILOs: Technical Design, Problem Solving."
        ),
    },
    {
        "title": "CPE Curriculum: Capstone Engineering Design",
        "content": (
            "Course: Capstone Engineering Design Project | BatStateU CPE\n"
            "Students design, implement, and defend a complete engineering system that meets "
            "real-world requirements. Topics: Project planning, prototyping, testing, "
            "technical writing, oral defense, user evaluation.\n"
            "Skills developed: Full-cycle engineering, research, teamwork, communication.\n"
            "Mapped ILOs: All ABET ILOs - Problem Solving, Communication, Ethics, Teamwork, Inquiry, Design."
        ),
    },
]

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
        seed_category(conn, "ilo", ILO_DOCUMENTS)
        seed_category(conn, "curriculum", CURRICULUM_DOCUMENTS)

        total = conn.execute(text("SELECT COUNT(*) FROM knowledge_chunks")).scalar()

    print(f"\n✅ Seeding complete! {total} knowledge chunks now in pgvector.")
    print("   The RAG pipeline is ready to use.\n")


if __name__ == "__main__":
    main()
