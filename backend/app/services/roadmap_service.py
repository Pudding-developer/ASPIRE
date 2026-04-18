"""
roadmap_service.py — Career roadmap overlay service.

Provides get_roadmap_with_overlay which merges roadmap node definitions with a
student's live skill and Agent 7 progression data.
"""
import copy
import json

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.pipeline_repository import get_latest_report


ROADMAP_SLUGS = {
    "Backend Developer": "backend",
    "Frontend Developer": "frontend",
    "Full Stack Developer": "full-stack",
    "DevOps Engineer": "devops",
    "Cybersecurity Analyst": "cyber-security",
    "Data Scientist": "data-scientist",
    "AI Engineer": "ai-engineer",
    "Machine Learning Engineer": "machine-learning",
    "Software Architect": "software-architect",
}

ROADMAP_NODES = {
    "backend": [
        {"id": "internet", "label": "Internet", "group": "Prerequisites", "order": 1},
        {"id": "http", "label": "HTTP", "group": "Prerequisites", "order": 2},
        {"id": "linux", "label": "Linux", "group": "OS & Terminal", "order": 3},
        {"id": "terminal", "label": "Terminal Usage", "group": "OS & Terminal", "order": 4},
        {"id": "git", "label": "Git", "group": "Version Control", "order": 5},
        {"id": "python", "label": "Python", "group": "Programming Language", "order": 6},
        {"id": "javascript-be", "label": "JavaScript", "group": "Programming Language", "order": 7},
        {"id": "java", "label": "Java", "group": "Programming Language", "order": 8},
        {"id": "postgresql", "label": "PostgreSQL", "group": "Databases", "order": 9},
        {"id": "mysql", "label": "MySQL", "group": "Databases", "order": 10},
        {"id": "mongodb", "label": "MongoDB", "group": "Databases", "order": 11},
        {"id": "redis", "label": "Redis", "group": "Caching", "order": 12},
        {"id": "rest-api", "label": "REST APIs", "group": "APIs", "order": 13},
        {"id": "graphql", "label": "GraphQL", "group": "APIs", "order": 14},
        {"id": "jwt", "label": "JWT Auth", "group": "Authentication", "order": 15},
        {"id": "oauth", "label": "OAuth 2.0", "group": "Authentication", "order": 16},
        {"id": "docker", "label": "Docker", "group": "Containerization", "order": 17},
        {"id": "github-actions", "label": "GitHub Actions", "group": "CI/CD", "order": 18},
        {"id": "aws", "label": "AWS", "group": "Cloud", "order": 19},
        {"id": "nginx", "label": "Nginx", "group": "Web Servers", "order": 20},
    ],
    "frontend": [
        {"id": "html", "label": "HTML", "group": "Basics", "order": 1},
        {"id": "css", "label": "CSS", "group": "Basics", "order": 2},
        {"id": "javascript-fe", "label": "JavaScript", "group": "Basics", "order": 3},
        {"id": "typescript", "label": "TypeScript", "group": "Language", "order": 4},
        {"id": "react", "label": "React", "group": "Framework", "order": 5},
        {"id": "vue", "label": "Vue.js", "group": "Framework", "order": 6},
        {"id": "tailwind", "label": "Tailwind CSS", "group": "Styling", "order": 7},
        {"id": "vite", "label": "Vite", "group": "Build Tools", "order": 8},
        {"id": "git-fe", "label": "Git", "group": "Version Control", "order": 9},
        {"id": "rest-api-fe", "label": "REST APIs", "group": "APIs", "order": 10},
        {"id": "testing-fe", "label": "Testing", "group": "Testing", "order": 11},
        {"id": "responsive", "label": "Responsive Design", "group": "CSS", "order": 12},
        {"id": "accessibility", "label": "Accessibility", "group": "Best Practices", "order": 13},
        {"id": "performance", "label": "Performance", "group": "Best Practices", "order": 14},
        {"id": "pwa", "label": "PWA", "group": "Advanced", "order": 15},
    ],
    "full-stack": [
        {"id": "html-fs", "label": "HTML", "group": "Frontend", "order": 1},
        {"id": "css-fs", "label": "CSS", "group": "Frontend", "order": 2},
        {"id": "javascript-fs", "label": "JavaScript", "group": "Frontend", "order": 3},
        {"id": "react-fs", "label": "React", "group": "Frontend", "order": 4},
        {"id": "typescript-fs", "label": "TypeScript", "group": "Frontend", "order": 5},
        {"id": "python-fs", "label": "Python", "group": "Backend", "order": 6},
        {"id": "fastapi-fs", "label": "FastAPI", "group": "Backend", "order": 7},
        {"id": "postgresql-fs", "label": "PostgreSQL", "group": "Database", "order": 8},
        {"id": "rest-api-fs", "label": "REST APIs", "group": "APIs", "order": 9},
        {"id": "git-fs", "label": "Git", "group": "Version Control", "order": 10},
        {"id": "docker-fs", "label": "Docker", "group": "DevOps", "order": 11},
        {"id": "auth-fs", "label": "Authentication", "group": "Security", "order": 12},
        {"id": "deployment-fs", "label": "Deployment", "group": "DevOps", "order": 13},
    ],
    "devops": [
        {"id": "linux-do", "label": "Linux", "group": "OS", "order": 1},
        {"id": "bash", "label": "Bash Scripting", "group": "OS", "order": 2},
        {"id": "networking-do", "label": "Networking", "group": "Fundamentals", "order": 3},
        {"id": "git-do", "label": "Git", "group": "Version Control", "order": 4},
        {"id": "docker-do", "label": "Docker", "group": "Containers", "order": 5},
        {"id": "kubernetes", "label": "Kubernetes", "group": "Containers", "order": 6},
        {"id": "github-actions-do", "label": "GitHub Actions", "group": "CI/CD", "order": 7},
        {"id": "jenkins", "label": "Jenkins", "group": "CI/CD", "order": 8},
        {"id": "aws-do", "label": "AWS", "group": "Cloud", "order": 9},
        {"id": "terraform", "label": "Terraform", "group": "IaC", "order": 10},
        {"id": "prometheus", "label": "Prometheus", "group": "Monitoring", "order": 11},
        {"id": "grafana", "label": "Grafana", "group": "Monitoring", "order": 12},
        {"id": "ansible", "label": "Ansible", "group": "Configuration", "order": 13},
    ],
    "cyber-security": [
        {"id": "networking-cs", "label": "Networking", "group": "Fundamentals", "order": 1},
        {"id": "linux-cs", "label": "Linux", "group": "OS", "order": 2},
        {"id": "cia-triad", "label": "CIA Triad", "group": "Concepts", "order": 3},
        {"id": "cryptography", "label": "Cryptography", "group": "Concepts", "order": 4},
        {"id": "python-cs", "label": "Python/Bash", "group": "Programming", "order": 5},
        {"id": "ethical-hacking", "label": "Ethical Hacking", "group": "Offensive", "order": 6},
        {"id": "pentest", "label": "Penetration Testing", "group": "Offensive", "order": 7},
        {"id": "siem", "label": "SIEM Tools", "group": "Defensive", "order": 8},
        {"id": "incident-response", "label": "Incident Response", "group": "Defensive", "order": 9},
        {"id": "vuln-scanning", "label": "Vulnerability Scanning", "group": "Tools", "order": 10},
        {"id": "comptia", "label": "CompTIA Security+", "group": "Certifications", "order": 11},
        {"id": "ceh", "label": "CEH", "group": "Certifications", "order": 12},
    ],
    "data-scientist": [
        {"id": "python-ds", "label": "Python", "group": "Programming", "order": 1},
        {"id": "statistics", "label": "Statistics", "group": "Mathematics", "order": 2},
        {"id": "linear-algebra", "label": "Linear Algebra", "group": "Mathematics", "order": 3},
        {"id": "pandas", "label": "Pandas", "group": "Data Analysis", "order": 4},
        {"id": "numpy", "label": "NumPy", "group": "Data Analysis", "order": 5},
        {"id": "matplotlib", "label": "Matplotlib/Seaborn", "group": "Visualization", "order": 6},
        {"id": "sql-ds", "label": "SQL", "group": "Databases", "order": 7},
        {"id": "sklearn", "label": "scikit-learn", "group": "ML", "order": 8},
        {"id": "feature-eng", "label": "Feature Engineering", "group": "ML", "order": 9},
        {"id": "deep-learning", "label": "Deep Learning", "group": "Advanced ML", "order": 10},
        {"id": "tensorflow", "label": "TensorFlow/PyTorch", "group": "Advanced ML", "order": 11},
        {"id": "model-deploy", "label": "Model Deployment", "group": "MLOps", "order": 12},
        {"id": "mlflow", "label": "MLflow", "group": "MLOps", "order": 13},
    ],
    "ai-engineer": [
        {"id": "python-ai", "label": "Python", "group": "Programming", "order": 1},
        {"id": "math-ai", "label": "Math & Statistics", "group": "Foundations", "order": 2},
        {"id": "ml-basics", "label": "ML Fundamentals", "group": "ML", "order": 3},
        {"id": "deep-learning-ai", "label": "Deep Learning", "group": "ML", "order": 4},
        {"id": "transformers", "label": "Transformers", "group": "LLMs", "order": 5},
        {"id": "prompt-eng", "label": "Prompt Engineering", "group": "LLMs", "order": 6},
        {"id": "langchain", "label": "LangChain", "group": "Frameworks", "order": 7},
        {"id": "rag", "label": "RAG Systems", "group": "Frameworks", "order": 8},
        {"id": "vector-db", "label": "Vector Databases", "group": "Storage", "order": 9},
        {"id": "mlops-ai", "label": "MLOps", "group": "Deployment", "order": 10},
        {"id": "cloud-ai", "label": "Cloud AI Services", "group": "Cloud", "order": 11},
    ],
    "machine-learning": [
        {"id": "python-ml", "label": "Python", "group": "Programming", "order": 1},
        {"id": "math-ml", "label": "Math & Statistics", "group": "Foundations", "order": 2},
        {"id": "data-processing", "label": "Data Processing", "group": "Data", "order": 3},
        {"id": "sklearn-ml", "label": "scikit-learn", "group": "ML Libraries", "order": 4},
        {"id": "pytorch", "label": "PyTorch", "group": "Deep Learning", "order": 5},
        {"id": "model-training", "label": "Model Training", "group": "Core ML", "order": 6},
        {"id": "feature-eng-ml", "label": "Feature Engineering", "group": "Core ML", "order": 7},
        {"id": "model-eval", "label": "Model Evaluation", "group": "Core ML", "order": 8},
        {"id": "model-deploy-ml", "label": "Model Deployment", "group": "MLOps", "order": 9},
        {"id": "docker-ml", "label": "Docker", "group": "MLOps", "order": 10},
        {"id": "mlflow-ml", "label": "MLflow", "group": "MLOps", "order": 11},
        {"id": "cloud-ml", "label": "Cloud ML Platforms", "group": "Cloud", "order": 12},
    ],
    "software-architect": [
        {"id": "programming-sa", "label": "Programming Mastery", "group": "Foundations", "order": 1},
        {"id": "design-patterns", "label": "Design Patterns", "group": "Foundations", "order": 2},
        {"id": "solid", "label": "SOLID Principles", "group": "Foundations", "order": 3},
        {"id": "data-structures-sa", "label": "Data Structures", "group": "CS Fundamentals", "order": 4},
        {"id": "system-design", "label": "System Design", "group": "Architecture", "order": 5},
        {"id": "microservices", "label": "Microservices", "group": "Architecture", "order": 6},
        {"id": "distributed-systems", "label": "Distributed Systems", "group": "Architecture", "order": 7},
        {"id": "api-design", "label": "API Design", "group": "Architecture", "order": 8},
        {"id": "databases-sa", "label": "Database Design", "group": "Data", "order": 9},
        {"id": "caching-sa", "label": "Caching Strategies", "group": "Performance", "order": 10},
        {"id": "security-sa", "label": "Security Architecture", "group": "Security", "order": 11},
        {"id": "cloud-sa", "label": "Cloud Architecture", "group": "Cloud", "order": 12},
        {"id": "leadership-sa", "label": "Technical Leadership", "group": "Soft Skills", "order": 13},
    ],
}

SKILL_KEYWORDS = {
    "python": ["python", "fastapi", "flask", "django"],
    "javascript": ["javascript", "js", "node", "express"],
    "typescript": ["typescript", "ts"],
    "react": ["react", "react.js", "reactjs"],
    "html": ["html", "html5"],
    "css": ["css", "css3", "tailwind", "bootstrap"],
    "git": ["git", "github", "version control"],
    "docker": ["docker", "containerization", "docker compose"],
    "postgresql": ["postgresql", "postgres", "sql", "database"],
    "linux": ["linux", "ubuntu", "bash", "terminal", "shell"],
    "networking": ["networking", "tcp/ip", "cisco", "network"],
    "rest-api": ["rest", "api", "rest api", "http"],
    "aws": ["aws", "cloud", "ec2", "s3"],
    "redis": ["redis", "caching"],
    "kubernetes": ["kubernetes", "k8s"],
    "github-actions": ["github actions", "ci/cd", "cicd"],
    "machine learning": ["machine learning", "ml", "sklearn", "scikit"],
    "deep learning": ["deep learning", "neural network", "pytorch", "tensorflow"],
    "statistics": ["statistics", "math", "linear algebra", "calculus"],
}


def _resolve_career_slug(career_name: str) -> str | None:
    """
    Resolve a career name to a ROADMAP_SLUGS slug.

    Strategy (in order):
    1. Exact match on ROADMAP_SLUGS keys.
    2. Exact match on slug values themselves (already a slug).
    3. Fuzzy / partial match: the stored career_name is a substring of a
       known key, or a known key is a substring of career_name.
       E.g. "Cybersecurity" ↔ "Cybersecurity Analyst"
    4. Return None if no match found.
    """
    if career_name in ROADMAP_SLUGS:
        return ROADMAP_SLUGS[career_name]

    if career_name in ROADMAP_SLUGS.values():
        return career_name

    career_lower = career_name.lower()
    for key, slug in ROADMAP_SLUGS.items():
        key_lower = key.lower()
        if career_lower in key_lower or key_lower in career_lower:
            return slug

    return None


async def get_roadmap_with_overlay(
    db: AsyncSession,
    student_id: int,
    career_slug: str,
) -> dict:
    """
    Build a career roadmap dict overlaying the student's skills and Agent 7
    progression data onto the canonical node list for career_slug.
    """
    # 1. Get career name from slug
    career_name = next(
        (k for k, v in ROADMAP_SLUGS.items() if v == career_slug),
        career_slug,
    )

    # 2. Get base nodes — deep copy so original dict is never mutated
    base_nodes = copy.deepcopy(ROADMAP_NODES.get(career_slug, []))
    if not base_nodes:
        raise ValueError(f"Unknown career slug: {career_slug}")

    # 3. Fetch latest career report
    career_report = await get_latest_report(db, student_id)

    unified_skills: list = []
    gap_skills: list = []
    progression: dict = {}

    if career_report and career_report.report_json:
        report = json.loads(career_report.report_json)
        unified_skills = report.get("skill_profile", {}).get("unified_skills", [])
        for match in report.get("career_matches", []):
            gap_skills.extend(match.get("gap_skills", []))
        if career_report.progression_json:
            parsed = json.loads(career_report.progression_json)
            progression = parsed if isinstance(parsed, dict) else {}

    # 4. Extract Agent 7 progression data
    closed_gaps = [g.lower() for g in progression.get("closed_gaps", [])]
    improved_skills = {
        s["skill"].lower(): s
        for s in progression.get("improved_skills", [])
    }
    next_milestone = progression.get("next_milestone") or {}
    if not isinstance(next_milestone, dict):
        next_milestone = {}
    next_milestone_skill = next_milestone.get("skill", "").lower()
    readiness_change = progression.get("readiness_change", 0)
    days_since = progression.get("days_since_last_report", None)
    motivational_insight = progression.get("motivational_insight", "")
    semester_summary = progression.get("semester_summary", "")
    first_run = progression.get("first_run", True)
    career_readiness_score = progression.get("career_readiness_score", 0)

    # When no report exists, first_run is effectively True
    if not career_report:
        first_run = True

    # 5. Overlay skills on nodes
    nodes = _overlay_skills(
        base_nodes,
        unified_skills,
        gap_skills,
        closed_gaps,
        improved_skills,
        next_milestone_skill,
    )

    # 6. Count statuses
    has_count = sum(1 for n in nodes if n["status"] == "has_skill")
    gap_count = sum(1 for n in nodes if n["status"] == "gap_skill")
    weak_count = sum(1 for n in nodes if n["status"] == "weak_skill")
    unassessed_count = sum(1 for n in nodes if n["status"] == "unassessed")
    total = len(nodes)

    readiness_pct = career_readiness_score if career_readiness_score > 0 else (
        round((has_count / total) * 100) if total > 0 else 0
    )

    return {
        "career": career_name,
        "slug": career_slug,
        "roadmap_url": f"https://roadmap.sh/{career_slug}",
        "total_nodes": total,
        "has_skill_count": has_count,
        "gap_skill_count": gap_count,
        "weak_skill_count": weak_count,
        "unassessed_count": unassessed_count,
        "readiness_percentage": readiness_pct,
        "readiness_change": readiness_change,
        "days_since_last_report": days_since,
        "motivational_insight": motivational_insight,
        "semester_summary": semester_summary,
        "first_run": first_run,
        "next_milestone": next_milestone,
        "nodes": nodes,
    }


def _overlay_skills(
    nodes: list,
    unified_skills: list,
    gap_skills: list,
    closed_gaps: list,
    improved_skills: dict,
    next_milestone_skill: str,
) -> list:
    gap_skills_lower = [g.lower() for g in gap_skills]

    for node in nodes:
        label_lower = node["label"].lower()
        node_id = node["id"].lower()

        # Default values
        node["status"] = "unassessed"
        node["score"] = None
        node["recently_closed"] = False
        node["improvement"] = None
        node["is_next_milestone"] = False

        # Check if next milestone
        if next_milestone_skill and next_milestone_skill in label_lower:
            node["is_next_milestone"] = True

        # Check if recently closed gap (Agent 7)
        if any(gap in label_lower for gap in closed_gaps):
            node["recently_closed"] = True

        # Check improvement badge (Agent 7)
        for skill_key, improvement_data in improved_skills.items():
            if skill_key in label_lower:
                node["improvement"] = improvement_data
                break

        # Match against unified skills
        matched_skill = None
        for skill in unified_skills:
            skill_name = skill.get("skill", "").lower()
            keywords = SKILL_KEYWORDS.get(skill_name, [skill_name])
            if any(kw in label_lower or kw in node_id for kw in keywords):
                matched_skill = skill
                break

        if matched_skill:
            score = matched_skill.get("final_score", 0)
            node["score"] = score
            if score >= 60:
                node["status"] = "has_skill"
            else:
                node["status"] = "weak_skill"
        elif any(gap in label_lower for gap in gap_skills_lower):
            node["status"] = "gap_skill"
            node["score"] = 0

    return nodes
