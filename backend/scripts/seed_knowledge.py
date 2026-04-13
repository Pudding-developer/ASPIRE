import asyncio
import json
import re
from pathlib import Path
import openpyxl
import google.generativeai as genai
from sqlmodel import delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import async_session_factory
from app.core.config import GEMINI_API_KEY
from app.models.knowledge import KnowledgeChunk
import time

genai.configure(api_key=GEMINI_API_KEY)

DOCUMENTS_DIR = Path(__file__).parent.parent / "Documents"
ML_DIR = Path(__file__).parent.parent / "ml" / "artifacts"
EXCEL_PATH = DOCUMENTS_DIR / "BSCpE_ILO_Skillset_Alignment.xlsx"

from app.ai.embeddings import embed_text as real_embed_text

def embed_text_sync(text: str) -> list[float]:
    for attempt in range(5):
        try:
            return real_embed_text(text, task_type="RETRIEVAL_DOCUMENT")
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower():
                wait = 2 ** attempt * 5
                print(f"    Rate limited — waiting {wait}s...")
                time.sleep(wait)
            else:
                raise
    raise Exception("Max retries exceeded for embedding")

async def embed_text(text: str) -> list[float]:
    return await asyncio.to_thread(embed_text_sync, text)

def parse_skillsets(wb) -> list[dict]:
    ws = wb["Skillset Reference"]
    chunks = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        if not row[0] or row[0] == "Category":
            continue
        category_type, skill_name, aligned_sos, description = row
        chunks.append({
            "title": skill_name,
            "content": f"""BSCpE Key Skillset: {skill_name}.
Type: {category_type} Skill.
Aligned ABET Student Outcomes: {aligned_sos}.
Description: {description}
Career relevance: Students who score well in this skillset are strong candidates
for careers that require {skill_name.lower()} competency.
This skillset is assessed across multiple BSU CpE subjects through ILO scores."""
        })
    return chunks

def parse_student_outcomes(wb) -> list[dict]:
    ws = wb["SO Legend"]
    chunks = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        if not row[0] or row[0] == "SO Code":
            continue
        so_code, so_name, full_definition = row
        chunks.append({
            "title": f"{so_code}: {so_name}",
            "content": f"""ABET Student Outcome {so_code}: {so_name}.
Full definition: {full_definition}
BSCpE context: This outcome is assessed through ILO scores across multiple
BSU CpE subjects. Students who consistently score high in {so_code}-aligned ILOs
demonstrate {so_name.lower()} competency.
Career implication: Strong {so_code} scores indicate readiness for careers
requiring {so_name.lower()} abilities in the Philippine tech industry."""
        })
    return chunks

def parse_curriculum(wb) -> list[dict]:
    ws = wb["ILO–Skillset Alignment"]
    chunks = []
    current_subject = None
    current_so = None
    current_ilos = []

    def flush_subject():
        if current_subject and current_ilos:
            ilo_text = "\n".join([
                f"  {i['ilo']}: {i['statement']}\n"
                f"    Technical skills: {i['tech']}\n"
                f"    Professional skills: {i['prof']}"
                for i in current_ilos
            ])
            chunks.append({
                "title": current_subject.strip(),
                "content": f"""BSU CpE Subject: {current_subject.strip()}.
Mapped Student Outcomes: {current_so or 'See ILO details'}.
Intended Learning Outcomes and Skills Developed:
{ilo_text}
Assessment context: Student scores in ILO1 through ILO{len(current_ilos)} of this subject
reflect their mastery of the technical and professional skills listed above.
High ILO scores in this subject predict competency in the mapped skill categories,
which in turn align with specific tech career paths."""
            })

    for row in ws.iter_rows(values_only=True):
        r0 = str(row[0]).strip() if row[0] else ''
        r2 = str(row[2]).strip() if row[2] else ''
        r3 = str(row[3]).strip() if row[3] else ''
        r4 = str(row[4]).strip() if row[4] else ''
        r5 = str(row[5]).strip() if row[5] else ''
        r6 = str(row[6]).strip() if row[6] else ''

        # Detect subject header
        is_subject = (
            row[1] is None and row[2] is None and row[0]
            and 'ILO' not in r0
            and 'BATANGAS' not in r0
            and 'Bachelor' not in r0
            and 'LEGEND' not in r0
            and 'Each ILO' not in r0
            and not r0.startswith('SO')
            and len(r0) > 3
            and '·' in r0
        )

        if is_subject:
            flush_subject()
            current_subject = r0
            current_so = None
            current_ilos = []

        elif r0.startswith('SO') and current_subject:
            current_so = r0.strip()

        elif r2.startswith('ILO') and current_subject and r3:
            current_ilos.append({
                'ilo': r2,
                'statement': r3,
                'tech': r5 if r5 and r5 != '—' else 'General engineering competency',
                'prof': r6 if r6 and r6 != '—' else 'Professional development'
            })

    flush_subject()
    return chunks

def parse_ml_meta() -> list[dict]:
    with open(ML_DIR / "meta.json") as f:
        meta = json.load(f)

    chunks = []
    for skill in meta.get("skills", meta.get("categories", meta.get("skill_categories", []))):
        skill_name = skill if isinstance(skill, str) else skill.get("name", str(skill))
        chunks.append({
            "title": f"ML Skill Category: {skill_name}",
            "content": f"""ASPIRE ML Model Skill Category: {skill_name}.
This skill category is one of the 20 categories predicted by ASPIRE's
GradientBoosting ML model based on a student's ILO scores.
The ML model predicts a proficiency score (0-100) for this category
by analyzing the student's ILO1, ILO2, ILO3, ILO4 scores across all
enrolled BSU CpE subjects.
Threshold classifications:
  Exceeding Expectations: score >= 80
  On Track: score >= 60
  Needs Attention: score >= 40
  Critical: score < 40
Career relevance: Strong scores in {skill_name} directly contribute to
career readiness scores for aligned tech career paths."""
        })
    return chunks

CAREER_PATHS = [
    {
        "title": "Backend Developer",
        "content": """Career Path: Backend Developer.
Philippine market outlook: High demand — top tech career in PH 2024-2025.
Average salary: PHP 45,000-85,000/month.
Top hiring locations: BGC, Makati, Ortigas, Cebu IT Park, Remote.
Required skills: Python or JavaScript, REST APIs, PostgreSQL,
Docker, Git, Linux, Redis, CI/CD pipelines.
BSCpE skillsets aligned: Programming & Software Development,
Operating Systems & Architecture, Networking & Communications.
ABET SOs: SO1, SO5, SO11.
Roadmap: https://roadmap.sh/backend
Learning order: Programming Language → Databases → REST APIs →
Authentication → Containerization → CI/CD → Cloud deployment.
BSU CpE subjects most relevant: CpE 406 OOP, CpE 411 Data Structures,
CpE 418 Software Design, CpE 424 Operating Systems, Database courses."""
    },
    {
        "title": "Full Stack Developer",
        "content": """Career Path: Full Stack Developer.
Philippine market outlook: Very high demand — most versatile tech role in PH.
Average salary: PHP 50,000-95,000/month.
Top hiring locations: BGC, Makati, Remote.
Required skills: React, Node.js or Python, PostgreSQL, REST APIs,
Git, Docker, basic DevOps, HTML/CSS/JavaScript.
BSCpE skillsets aligned: Programming & Software Development,
Operating Systems & Architecture, Modern Engineering Tools.
ABET SOs: SO1, SO3, SO5, SO11.
Roadmap: https://roadmap.sh/full-stack
Learning order: HTML/CSS/JS → React → Backend Language →
Database → APIs → Authentication → Deployment.
BSU CpE subjects most relevant: CpE 406 OOP, CpE 411 Data Structures,
CpE 418 Software Design, Web Systems and Technologies."""
    },
    {
        "title": "Frontend Developer",
        "content": """Career Path: Frontend Developer.
Philippine market outlook: High demand especially for React developers.
Average salary: PHP 35,000-75,000/month.
Top hiring locations: BGC, Makati, Cebu, Remote.
Required skills: HTML, CSS, JavaScript, React or Vue,
TypeScript, Git, REST API integration, responsive design, accessibility.
BSCpE skillsets aligned: Programming & Software Development,
Modern Engineering Tools.
ABET SOs: SO1, SO5, SO11.
Roadmap: https://roadmap.sh/frontend
Learning order: HTML → CSS → JavaScript → React →
TypeScript → Build Tools → Testing → Performance.
BSU CpE subjects most relevant: CpE 401 Programming 1,
CpE 406 OOP, CpE 418 Software Design."""
    },
    {
        "title": "DevOps Engineer",
        "content": """Career Path: DevOps Engineer.
Philippine market outlook: Growing — critical shortage of qualified DevOps in PH.
Average salary: PHP 60,000-120,000/month.
Top hiring locations: BGC, Remote.
Required skills: Linux, Docker, Kubernetes, CI/CD,
AWS or GCP, Terraform, monitoring tools, bash scripting, networking.
BSCpE skillsets aligned: Operating Systems & Architecture,
Networking & Communications, Modern Engineering Tools.
ABET SOs: SO1, SO3, SO5, SO11.
Roadmap: https://roadmap.sh/devops
Learning order: Linux → Networking → Git → Docker →
CI/CD → Kubernetes → Cloud → Monitoring → Infrastructure as Code.
BSU CpE subjects most relevant: CpE 412 CISCO 1, CpE 419 CISCO 2,
CpE 423 CISCO 3, CpE 424 Operating Systems, CpE 427 CISCO 4."""
    },
    {
        "title": "Cybersecurity Analyst",
        "content": """Career Path: Cybersecurity Analyst.
Philippine market outlook: Critical demand — PH ranks high in cyberattack targets.
Average salary: PHP 50,000-100,000/month.
Top hiring locations: BGC, Makati, Government agencies, Banks, BPO.
Required skills: Networking, Linux, ethical hacking, penetration testing,
SIEM tools, incident response, security frameworks, cryptography.
BSCpE skillsets aligned: Networking & Communications,
Operating Systems & Architecture, Ethics & Professionalism.
ABET SOs: SO1, SO2, SO3, SO5, SO6.
Roadmap: https://roadmap.sh/cyber-security
Learning order: Networking Fundamentals → Linux → Security Basics →
Ethical Hacking → Penetration Testing → Incident Response → Certifications.
BSU CpE subjects most relevant: CpE 412-427 CISCO track,
CpE 424 Operating Systems, CpE 427 Connecting Networks and Security."""
    },
    {
        "title": "Data Scientist",
        "content": """Career Path: Data Scientist.
Philippine market outlook: High growth — banking, BPO, and tech sectors.
Average salary: PHP 55,000-100,000/month.
Top hiring locations: BGC, Makati, Ortigas, Remote.
Required skills: Python, pandas, scikit-learn, SQL,
data visualization, statistical analysis, machine learning, Jupyter.
BSCpE skillsets aligned: Data Science & AI/ML,
Mathematics & Science Foundations, Programming & Software Development.
ABET SOs: SO1, SO2, SO5.
Roadmap: https://roadmap.sh/data-scientist
Learning order: Python → Statistics → SQL → Data Analysis →
Machine Learning → Deep Learning → Model Deployment.
BSU CpE subjects most relevant: MATH 401-404, ENGG 414 Numerical Methods,
CpEE 403 Data Mining/AI Elective, MATH 403 Engineering Data Analysis."""
    },
    {
        "title": "AI Engineer",
        "content": """Career Path: AI Engineer.
Philippine market outlook: Emerging — fastest growing tech role globally.
Average salary: PHP 70,000-130,000/month.
Top hiring locations: BGC, Remote.
Required skills: Python, PyTorch or TensorFlow, LLMs,
prompt engineering, vector databases, RAG pipelines, MLOps.
BSCpE skillsets aligned: Data Science & AI/ML,
Mathematics & Science Foundations, Programming & Software Development.
ABET SOs: SO1, SO2, SO3, SO5.
Roadmap: https://roadmap.sh/ai-engineer
Learning order: Python → ML Fundamentals → Deep Learning →
Transformers/LLMs → Prompt Engineering → RAG → MLOps → Cloud AI.
BSU CpE subjects most relevant: CpEE 403 Data Mining/AI Elective,
ENGG 414 Numerical Methods, MATH 403 Engineering Data Analysis."""
    },
    {
        "title": "Machine Learning Engineer",
        "content": """Career Path: Machine Learning Engineer.
Philippine market outlook: Growing — fintech and healthtech sectors leading.
Average salary: PHP 65,000-120,000/month.
Top hiring locations: BGC, Remote.
Required skills: Python, scikit-learn, TensorFlow or PyTorch,
feature engineering, model deployment, Docker, REST APIs for ML, MLflow.
BSCpE skillsets aligned: Data Science & AI/ML,
Mathematics & Science Foundations, Engineering Design & Research.
ABET SOs: SO1, SO2, SO3, SO5.
Roadmap: https://roadmap.sh/machine-learning
Learning order: Python → Statistics → ML Algorithms →
Model Training → Feature Engineering → Model Deployment → MLOps.
BSU CpE subjects most relevant: CpEE 403 Data Mining/AI Elective,
ENGG 414 Numerical Methods, CpE 411 Data Structures."""
    },
    {
        "title": "Software Architect",
        "content": """Career Path: Software Architect.
Philippine market outlook: Senior role — 5+ years experience typically required.
Average salary: PHP 100,000-200,000/month.
Top hiring locations: BGC, Makati, Remote.
Required skills: System design, microservices, distributed systems,
cloud architecture, API design patterns, database design,
security architecture, performance optimization.
BSCpE skillsets aligned: Programming & Software Development,
Engineering Design & Research, Operating Systems & Architecture.
ABET SOs: SO1, SO3, SO5, SO11, SO12.
Roadmap: https://roadmap.sh/software-architect
Learning order: Strong backend foundation → System Design →
Distributed Systems → Cloud → Security → Leadership.
BSU CpE subjects most relevant: CpE 418 Software Design,
CpE 411 Data Structures, CpE 422 CpE Practice and Design 1,
CpE 430 CpE Practice and Design 2, Capstone."""
    }
]

ROADMAP_LEARNING_PATHS = [
    {
        "title": "Backend Developer learning path for BSU CpE",
        "content": """Backend Developer roadmap — ordered learning stages for BSU CpE students.
Stage 1 — Already covered in BSCpE curriculum:
  Internet basics HTTP DNS, Linux fundamentals (CpE 424 Operating Systems),
  Git version control, Networking fundamentals (CISCO 1-4 track).
Stage 2 — Programming proficiency (CpE 401, CpE 406 OOP):
  Python or JavaScript as primary backend language.
  OOP patterns, data structures (CpE 411), algorithms.
Stage 3 — Databases (Database Management subject):
  PostgreSQL — relational design, SQL, indexing, transactions.
  ORM — SQLAlchemy. Redis for caching.
Stage 4 — APIs:
  REST API design and implementation using FastAPI or Express.
  Authentication — JWT, OAuth 2.0.
Stage 5 — Containerization (gap for most BSU CpE students):
  Docker — containers, images, docker-compose.
Stage 6 — CI/CD (gap for most BSU CpE students):
  GitHub Actions for automated testing and deployment.
Stage 7 — Cloud (gap for most BSU CpE students):
  AWS or GCP fundamentals, deploy a production backend."""
    },
    {
        "title": "DevOps Engineer learning path for BSU CpE",
        "content": """DevOps Engineer roadmap — ordered learning stages for BSU CpE students.
Stage 1 — Strong BSCpE foundation:
  Linux system administration (CpE 424 Operating Systems).
  Networking — TCP/IP, DNS, routing (CISCO 1-4 track CpE 412-427).
  Shell scripting — bash.
Stage 2 — Version control:
  Git workflows, branching strategies, GitHub or GitLab.
Stage 3 — Containerization (gap skill):
  Docker — images, containers, docker-compose, container security.
Stage 4 — CI/CD (gap skill):
  GitHub Actions, Jenkins or GitLab CI — automated pipelines.
Stage 5 — Cloud (gap skill):
  AWS or GCP fundamentals — EC2, S3, VPC, IAM.
Stage 6 — Orchestration (advanced gap):
  Kubernetes — pods, deployments, services, Helm charts.
Stage 7 — Monitoring (advanced gap):
  Prometheus, Grafana, logging and alerting systems."""
    },
    {
        "title": "Data Scientist learning path for BSU CpE",
        "content": """Data Scientist roadmap — ordered learning stages for BSU CpE students.
Stage 1 — Strong BSCpE foundation:
  Mathematics — calculus (MATH 401-402), statistics (MATH 403),
  differential equations (MATH 404), numerical methods (ENGG 414).
Stage 2 — Python for data:
  pandas, numpy for data manipulation.
  matplotlib, seaborn for visualization.
Stage 3 — Machine learning (partially covered in CpEE 403):
  scikit-learn, model training and evaluation.
  Regression, classification, clustering algorithms.
Stage 4 — SQL and databases:
  Data querying, aggregation, working with large datasets.
Stage 5 — Advanced ML (gap skill):
  Neural networks, TensorFlow or PyTorch.
  Feature engineering, cross-validation, hyperparameter tuning.
Stage 6 — Deployment (gap skill):
  Model serving via REST APIs, MLflow for experiment tracking."""
    },
    {
        "title": "AI Engineer learning path for BSU CpE",
        "content": """AI Engineer roadmap — ordered learning stages for BSU CpE students.
Stage 1 — Strong BSCpE foundation:
  Python, mathematics, engineering data analysis (MATH 403).
  Numerical methods (ENGG 414), data science elective (CpEE 403).
Stage 2 — Machine learning fundamentals:
  scikit-learn, model training, evaluation metrics.
Stage 3 — Deep learning (gap skill):
  Neural networks, backpropagation, PyTorch or TensorFlow.
Stage 4 — LLMs and generative AI (gap skill):
  Transformer architecture, prompt engineering, LangChain.
Stage 5 — RAG and vector databases (gap skill):
  Embeddings, semantic search, pgvector, ChromaDB.
Stage 6 — MLOps and deployment (gap skill):
  Model serving, monitoring, API wrapping for AI models.
Stage 7 — Cloud AI (gap skill):
  Google Vertex AI, AWS SageMaker, cost optimization."""
    },
    {
        "title": "Cybersecurity Analyst learning path for BSU CpE",
        "content": """Cybersecurity Analyst roadmap — ordered stages for BSU CpE students.
Stage 1 — Strong BSCpE foundation:
  Networking (CISCO 1-4 track — CpE 412, 419, 423, 427).
  Operating Systems (CpE 424), Ethics (GEd 107).
Stage 2 — Security fundamentals:
  CIA triad, common attack vectors, cryptography basics.
Stage 3 — Linux security (partially covered):
  Hardening, permissions, file system security.
Stage 4 — Ethical hacking (gap skill):
  Penetration testing, Kali Linux, vulnerability scanning.
Stage 5 — Incident response (gap skill):
  SIEM tools, log analysis, forensics basics.
Stage 6 — Certifications (gap skill):
  CompTIA Security+, CEH, or CCNA Security."""
    },
    {
        "title": "Full Stack Developer learning path for BSU CpE",
        "content": """Full Stack Developer roadmap — ordered learning stages for BSU CpE students.
Stage 1 — BSCpE foundation:
  Data structures and algorithms (CpE 411).
  OOP principles (CpE 406 OOP).
  Software design (CpE 418).
Stage 2 — Frontend basics (gap skill):
  HTML, CSS, JavaScript fundamentals.
  Responsive design, DOM manipulation.
Stage 3 — Frontend frameworks (gap skill):
  React or Vue.js. State management, routing.
Stage 4 — Backend APIs (partially covered):
  Node.js or Python (FastAPI/Django).
  RESTful API design, authentication.
Stage 5 — Databases (Database Management subject):
  Relational databases (PostgreSQL/MySQL), SQL queries.
Stage 6 — Full Stack Integration (gap skill):
  Connecting frontend to backend, handling CORS, deployment strategies (Vercel, Heroku, AWS)."""
    },
    {
        "title": "Frontend Developer learning path for BSU CpE",
        "content": """Frontend Developer roadmap — ordered learning stages for BSU CpE students.
Stage 1 — BSCpE foundation:
  Basic programming logic (CpE 401, CpE 404).
  Software design principles (CpE 418).
Stage 2 — Core web technologies (gap skill):
  Semantic HTML5, CSS3, modern JavaScript (ES6+).
Stage 3 — UI/UX and styling (gap skill):
  CSS frameworks (TailwindCSS, Bootstrap), responsive design.
Stage 4 — Component-driven development (gap skill):
  React, Vue, or Angular. Managing props, state, and lifecycle.
Stage 5 — Advanced state and routing (gap skill):
  Redux, Context API, React Router.
Stage 6 — Web performance and testing (gap skill):
  Lighthouse optimization, Jest, Cypress testing.
Stage 7 — Progressive Web Apps (PWA) (gap skill):
  Service workers, offline support."""
    },
    {
        "title": "Software Architect learning path for BSU CpE",
        "content": """Software Architect roadmap — ordered learning stages for BSU CpE students.
Stage 1 — Strong BSCpE foundation:
  Data structures (CpE 411), Object-oriented programming (CpE 406).
  Software design (CpE 418), Operating Systems (CpE 424).
Stage 2 — Backend mastery (advanced):
  Deep expertise in backend languages, databases, and APIs.
Stage 3 — System design fundamentals (gap skill):
  Scalability, availability, CAP theorem, load balancing.
Stage 4 — Architecture patterns (gap skill):
  Microservices vs Monoliths, event-driven architecture.
  Message queues (RabbitMQ, Kafka).
Stage 5 — Cloud and infrastructure (gap skill):
  AWS/GCP/Azure architecture, container orchestration (Kubernetes).
Stage 6 — Security and compliance (partially covered in CISCO 4):
  Zero-trust architecture, OAuth 2.0, data encryption.
Stage 7 — Technical leadership (developed in Capstone):
  Mentoring, technology selection, resolving technical debt."""
    },
    {
        "title": "Machine Learning Engineer learning path for BSU CpE",
        "content": """Machine Learning Engineer roadmap — ordered learning stages for BSU CpE students.
Stage 1 — Strong BSCpE foundation:
  Python programming, Engineering data analysis (MATH 403), Numerical methods (ENGG 414).
Stage 2 — Data manipulation basics:
  pandas, numpy, data cleaning and preprocessing.
Stage 3 — Core machine learning (CpEE 403 Data Mining/AI Elective):
  scikit-learn, regression, classification, clustering.
Stage 4 — Advanced ML and Deep Learning (gap skill):
  Neural networks, CNNs, RNNs, PyTorch or TensorFlow.
Stage 5 — MLOps fundamentals (gap skill):
  MLflow, model versioning, experiment tracking.
Stage 6 — API engineering (partially covered):
  Deploying models behind REST APIs (FastAPI/Flask).
Stage 7 — Cloud ML deployment (gap skill):
  Dockerizing ML models, deploying on AWS SageMaker or GCP Vertex AI."""
    }
]

async def seed_category(
    session: AsyncSession,
    category: str,
    chunks: list[dict]
) -> int:
    print(f"\n  Seeding [{category}] — {len(chunks)} chunks...")
    count = 0
    for i, chunk in enumerate(chunks):
        try:
            embedding = await embed_text(chunk["content"])
            knowledge = KnowledgeChunk(
                category=category,
                title=chunk["title"],
                content=chunk["content"],
                embedding=embedding
            )
            session.add(knowledge)
            count += 1
            if (i + 1) % 5 == 0:
                await session.commit()
                print(f"    {i+1}/{len(chunks)} embedded...")
            time.sleep(0.5)  # respect Gemini rate limits
        except Exception as e:
            print(f"    ERROR on chunk '{chunk['title']}': {e}")
            continue
    await session.commit()
    print(f"  ✅ [{category}] — {count}/{len(chunks)} seeded")
    return count

async def main():
    print("ASPIRE Knowledge Base Seeder")
    print("=" * 40)

    wb = openpyxl.load_workbook(EXCEL_PATH)

    print("\nParsing documents...")
    skillsets = parse_skillsets(wb)
    outcomes = parse_student_outcomes(wb)
    curriculum = parse_curriculum(wb)
    ml_skills = parse_ml_meta()

    total = (
        len(skillsets) + len(outcomes) + len(curriculum) +
        len(ml_skills) + len(CAREER_PATHS) + len(ROADMAP_LEARNING_PATHS)
    )
    print(f"Total chunks to seed: {total}")
    print(f"  skillset: {len(skillsets)}")
    print(f"  ilo: {len(outcomes)}")
    print(f"  curriculum: {len(curriculum)}")
    print(f"  skillset_ml: {len(ml_skills)}")
    print(f"  career_path: {len(CAREER_PATHS)}")
    print(f"  roadmap: {len(ROADMAP_LEARNING_PATHS)}")

    async with async_session_factory() as session:
        print("\nClearing existing knowledge chunks...")
        await session.execute(delete(KnowledgeChunk))
        await session.commit()
        print("  ✅ Cleared")

        total_seeded = 0
        total_seeded += await seed_category(session, "skillset", skillsets)
        total_seeded += await seed_category(session, "ilo", outcomes)
        total_seeded += await seed_category(session, "curriculum", curriculum)
        total_seeded += await seed_category(session, "skillset_ml", ml_skills)
        total_seeded += await seed_category(session, "career_path", CAREER_PATHS)
        total_seeded += await seed_category(session, "roadmap", ROADMAP_LEARNING_PATHS)

    print("\n" + "=" * 40)
    print(f"✅ Knowledge base seeded: {total_seeded}/{total} chunks")
    print("Run 'python scripts/seed_knowledge.py' again to re-seed")

if __name__ == "__main__":
    asyncio.run(main())
