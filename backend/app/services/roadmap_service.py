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
    "Data Scientist": "ai-data-scientist",
    "AI Engineer": "ai-engineer",
    "Machine Learning Engineer": "machine-learning",
    "Software Architect": "software-architect",
}

ROADMAP_NODES = {
    "backend": [
        {
            "id": "internet",
            "label": "Internet",
            "group": "Internet",
            "order": 1
        },
        {
            "id": "http",
            "label": "HTTP/HTTPS",
            "group": "Internet",
            "order": 2
        },
        {
            "id": "dns",
            "label": "DNS",
            "group": "Internet",
            "order": 3
        },
        {
            "id": "hosting",
            "label": "Domain Name & Hosting",
            "group": "Internet",
            "order": 4
        },
        {
            "id": "linux",
            "label": "Linux OS",
            "group": "OS & Terminal",
            "order": 5
        },
        {
            "id": "terminal",
            "label": "Terminal Usage",
            "group": "OS & Terminal",
            "order": 6
        },
        {
            "id": "process-mgt",
            "label": "Process Management",
            "group": "OS & Terminal",
            "order": 7
        },
        {
            "id": "threads",
            "label": "Threads and Concurrency",
            "group": "OS & Terminal",
            "order": 8
        },
        {
            "id": "memory",
            "label": "Memory Management",
            "group": "OS & Terminal",
            "order": 9
        },
        {
            "id": "git",
            "label": "Git",
            "group": "Version Control",
            "order": 10
        },
        {
            "id": "github",
            "label": "GitHub/GitLab",
            "group": "Version Control",
            "order": 11
        },
        {
            "id": "python",
            "label": "Python",
            "group": "Programming Language",
            "order": 12
        },
        {
            "id": "java",
            "label": "Java",
            "group": "Programming Language",
            "order": 13
        },
        {
            "id": "csharp",
            "label": "C#",
            "group": "Programming Language",
            "order": 14
        },
        {
            "id": "go",
            "label": "Go",
            "group": "Programming Language",
            "order": 15
        },
        {
            "id": "javascript",
            "label": "JavaScript/Node.js",
            "group": "Programming Language",
            "order": 16
        },
        {
            "id": "postgresql",
            "label": "PostgreSQL",
            "group": "Databases",
            "order": 17
        },
        {
            "id": "mysql",
            "label": "MySQL",
            "group": "Databases",
            "order": 18
        },
        {
            "id": "mongodb",
            "label": "MongoDB",
            "group": "Databases",
            "order": 19
        },
        {
            "id": "redis",
            "label": "Redis",
            "group": "Databases",
            "order": 20
        },
        {
            "id": "elasticsearch",
            "label": "Elasticsearch",
            "group": "Databases",
            "order": 21
        },
        {
            "id": "rest-api",
            "label": "REST APIs",
            "group": "APIs",
            "order": 22
        },
        {
            "id": "graphql",
            "label": "GraphQL",
            "group": "APIs",
            "order": 23
        },
        {
            "id": "grpc",
            "label": "gRPC",
            "group": "APIs",
            "order": 24
        },
        {
            "id": "caching",
            "label": "Caching Server",
            "group": "Caching",
            "order": 25
        },
        {
            "id": "cdn",
            "label": "CDN",
            "group": "Caching",
            "order": 26
        },
        {
            "id": "jwt",
            "label": "JWT Auth",
            "group": "Security",
            "order": 27
        },
        {
            "id": "oauth",
            "label": "OAuth 2.0",
            "group": "Security",
            "order": 28
        },
        {
            "id": "cors",
            "label": "CORS",
            "group": "Security",
            "order": 29
        },
        {
            "id": "xss",
            "label": "XSS / SQL Injection",
            "group": "Security",
            "order": 30
        },
        {
            "id": "unit-testing",
            "label": "Unit Testing",
            "group": "Testing",
            "order": 31
        },
        {
            "id": "integration",
            "label": "Integration Testing",
            "group": "Testing",
            "order": 32
        },
        {
            "id": "ci-cd",
            "label": "CI/CD Concepts",
            "group": "CI/CD",
            "order": 33
        },
        {
            "id": "github-actions",
            "label": "GitHub Actions",
            "group": "CI/CD",
            "order": 34
        },
        {
            "id": "design-patterns",
            "label": "Design Patterns",
            "group": "Architecture",
            "order": 35
        },
        {
            "id": "microservices",
            "label": "Microservices",
            "group": "Architecture",
            "order": 36
        },
        {
            "id": "rabbitmq",
            "label": "RabbitMQ",
            "group": "Message Brokers",
            "order": 37
        },
        {
            "id": "kafka",
            "label": "Kafka",
            "group": "Message Brokers",
            "order": 38
        },
        {
            "id": "docker",
            "label": "Docker",
            "group": "Containerization",
            "order": 39
        },
        {
            "id": "kubernetes",
            "label": "Kubernetes",
            "group": "Containerization",
            "order": 40
        },
        {
            "id": "nginx",
            "label": "Nginx",
            "group": "Web Servers",
            "order": 41
        },
        {
            "id": "aws",
            "label": "AWS / GCP",
            "group": "Cloud",
            "order": 42
        }
    ],
    "frontend": [
        {
            "id": "internet-fe",
            "label": "Internet Fundamentals",
            "group": "Prerequisites",
            "order": 1
        },
        {
            "id": "html",
            "label": "HTML5",
            "group": "HTML",
            "order": 2
        },
        {
            "id": "semantic-html",
            "label": "Semantic HTML",
            "group": "HTML",
            "order": 3
        },
        {
            "id": "accessibility",
            "label": "Accessibility (a11y)",
            "group": "HTML",
            "order": 4
        },
        {
            "id": "css",
            "label": "CSS3",
            "group": "CSS",
            "order": 5
        },
        {
            "id": "flexbox",
            "label": "Flexbox",
            "group": "CSS",
            "order": 6
        },
        {
            "id": "grid",
            "label": "CSS Grid",
            "group": "CSS",
            "order": 7
        },
        {
            "id": "responsive",
            "label": "Responsive Design",
            "group": "CSS",
            "order": 8
        },
        {
            "id": "javascript",
            "label": "JavaScript Fundamentals",
            "group": "JavaScript",
            "order": 9
        },
        {
            "id": "dom",
            "label": "DOM Manipulation",
            "group": "JavaScript",
            "order": 10
        },
        {
            "id": "es6",
            "label": "ES6+ Features",
            "group": "JavaScript",
            "order": 11
        },
        {
            "id": "fetch-api",
            "label": "Fetch API / AJAX",
            "group": "JavaScript",
            "order": 12
        },
        {
            "id": "git",
            "label": "Git",
            "group": "Version Control",
            "order": 13
        },
        {
            "id": "npm",
            "label": "npm / yarn",
            "group": "Package Managers",
            "order": 14
        },
        {
            "id": "sass",
            "label": "Sass / LESS",
            "group": "CSS Architecture",
            "order": 15
        },
        {
            "id": "bem",
            "label": "BEM",
            "group": "CSS Architecture",
            "order": 16
        },
        {
            "id": "tailwind",
            "label": "Tailwind CSS",
            "group": "CSS Frameworks",
            "order": 17
        },
        {
            "id": "react",
            "label": "React",
            "group": "Frameworks",
            "order": 18
        },
        {
            "id": "vue",
            "label": "Vue.js",
            "group": "Frameworks",
            "order": 19
        },
        {
            "id": "angular",
            "label": "Angular",
            "group": "Frameworks",
            "order": 20
        },
        {
            "id": "redux",
            "label": "Redux / Zustand",
            "group": "State Management",
            "order": 21
        },
        {
            "id": "vite",
            "label": "Vite",
            "group": "Build Tools",
            "order": 22
        },
        {
            "id": "webpack",
            "label": "Webpack",
            "group": "Build Tools",
            "order": 23
        },
        {
            "id": "typescript",
            "label": "TypeScript",
            "group": "Type Checkers",
            "order": 24
        },
        {
            "id": "jest",
            "label": "Jest",
            "group": "Testing",
            "order": 25
        },
        {
            "id": "cypress",
            "label": "Cypress / Playwright",
            "group": "Testing",
            "order": 26
        },
        {
            "id": "auth-fe",
            "label": "Authentication (JWT/OAuth)",
            "group": "Security",
            "order": 27
        },
        {
            "id": "cors-fe",
            "label": "CORS",
            "group": "Security",
            "order": 28
        },
        {
            "id": "ssr",
            "label": "Server Side Rendering",
            "group": "Advanced",
            "order": 29
        },
        {
            "id": "ssg",
            "label": "Static Site Generation",
            "group": "Advanced",
            "order": 30
        },
        {
            "id": "nextjs",
            "label": "Next.js",
            "group": "Advanced",
            "order": 31
        },
        {
            "id": "pwa",
            "label": "Progressive Web Apps",
            "group": "Advanced",
            "order": 32
        },
        {
            "id": "web-sockets",
            "label": "Web Sockets",
            "group": "Advanced",
            "order": 33
        },
        {
            "id": "webassembly",
            "label": "WebAssembly",
            "group": "Advanced",
            "order": 34
        }
    ],
    "full-stack": [
        {
            "id": "html-css",
            "label": "HTML & CSS Basics",
            "group": "Frontend",
            "order": 1
        },
        {
            "id": "javascript",
            "label": "JavaScript (ES6+)",
            "group": "Frontend",
            "order": 2
        },
        {
            "id": "react",
            "label": "React",
            "group": "Frontend Frameworks",
            "order": 3
        },
        {
            "id": "typescript",
            "label": "TypeScript",
            "group": "Frontend Frameworks",
            "order": 4
        },
        {
            "id": "tailwind",
            "label": "Tailwind CSS",
            "group": "Frontend Frameworks",
            "order": 5
        },
        {
            "id": "nodejs",
            "label": "Node.js",
            "group": "Backend",
            "order": 6
        },
        {
            "id": "express",
            "label": "Express.js",
            "group": "Backend",
            "order": 7
        },
        {
            "id": "python",
            "label": "Python",
            "group": "Backend",
            "order": 8
        },
        {
            "id": "fastapi",
            "label": "FastAPI",
            "group": "Backend",
            "order": 9
        },
        {
            "id": "postgresql",
            "label": "PostgreSQL",
            "group": "Databases",
            "order": 10
        },
        {
            "id": "mongodb",
            "label": "MongoDB",
            "group": "Databases",
            "order": 11
        },
        {
            "id": "redis",
            "label": "Redis",
            "group": "Databases",
            "order": 12
        },
        {
            "id": "orm",
            "label": "ORM (Prisma/SQLAlchemy)",
            "group": "Databases",
            "order": 13
        },
        {
            "id": "rest-api",
            "label": "RESTful APIs",
            "group": "APIs",
            "order": 14
        },
        {
            "id": "graphql",
            "label": "GraphQL",
            "group": "APIs",
            "order": 15
        },
        {
            "id": "git",
            "label": "Git & GitHub",
            "group": "Tools",
            "order": 16
        },
        {
            "id": "linux",
            "label": "Linux Fundamentals",
            "group": "Tools",
            "order": 17
        },
        {
            "id": "auth",
            "label": "Authentication (JWT)",
            "group": "Security",
            "order": 18
        },
        {
            "id": "security-basics",
            "label": "OWASP Top 10",
            "group": "Security",
            "order": 19
        },
        {
            "id": "docker",
            "label": "Docker",
            "group": "DevOps",
            "order": 20
        },
        {
            "id": "ci-cd",
            "label": "CI/CD Pipelines",
            "group": "DevOps",
            "order": 21
        },
        {
            "id": "aws",
            "label": "Cloud Platforms (AWS)",
            "group": "DevOps",
            "order": 22
        },
        {
            "id": "nginx",
            "label": "Nginx",
            "group": "DevOps",
            "order": 23
        },
        {
            "id": "testing",
            "label": "Unit & E2E Testing",
            "group": "Testing",
            "order": 24
        },
        {
            "id": "system-design",
            "label": "Basic System Design",
            "group": "Architecture",
            "order": 25
        }
    ],
    "devops": [
        {
            "id": "programming",
            "label": "Programming (Python/Go)",
            "group": "Prerequisites",
            "order": 1
        },
        {
            "id": "linux",
            "label": "Linux / Unix",
            "group": "OS",
            "order": 2
        },
        {
            "id": "bash",
            "label": "Bash Scripting",
            "group": "OS",
            "order": 3
        },
        {
            "id": "process-mgt",
            "label": "Process Management",
            "group": "OS",
            "order": 4
        },
        {
            "id": "networking",
            "label": "Networking Concepts",
            "group": "Network & Security",
            "order": 5
        },
        {
            "id": "dns",
            "label": "DNS / HTTP",
            "group": "Network & Security",
            "order": 6
        },
        {
            "id": "firewalls",
            "label": "Firewalls / Proxies",
            "group": "Network & Security",
            "order": 7
        },
        {
            "id": "git",
            "label": "Git",
            "group": "Version Control",
            "order": 8
        },
        {
            "id": "docker",
            "label": "Docker",
            "group": "Containers",
            "order": 9
        },
        {
            "id": "container-registry",
            "label": "Container Registries",
            "group": "Containers",
            "order": 10
        },
        {
            "id": "kubernetes",
            "label": "Kubernetes",
            "group": "Orchestration",
            "order": 11
        },
        {
            "id": "helm",
            "label": "Helm",
            "group": "Orchestration",
            "order": 12
        },
        {
            "id": "istio",
            "label": "Service Mesh (Istio)",
            "group": "Orchestration",
            "order": 13
        },
        {
            "id": "aws",
            "label": "AWS",
            "group": "Cloud",
            "order": 14
        },
        {
            "id": "azure",
            "label": "Azure",
            "group": "Cloud",
            "order": 15
        },
        {
            "id": "terraform",
            "label": "Terraform",
            "group": "Infrastructure as Code",
            "order": 16
        },
        {
            "id": "ansible",
            "label": "Ansible",
            "group": "Infrastructure as Code",
            "order": 17
        },
        {
            "id": "ci-cd",
            "label": "CI/CD Concepts",
            "group": "CI/CD",
            "order": 18
        },
        {
            "id": "github-actions",
            "label": "GitHub Actions",
            "group": "CI/CD",
            "order": 19
        },
        {
            "id": "jenkins",
            "label": "Jenkins",
            "group": "CI/CD",
            "order": 20
        },
        {
            "id": "gitlab-ci",
            "label": "GitLab CI",
            "group": "CI/CD",
            "order": 21
        },
        {
            "id": "prometheus",
            "label": "Prometheus",
            "group": "Monitoring",
            "order": 22
        },
        {
            "id": "grafana",
            "label": "Grafana",
            "group": "Monitoring",
            "order": 23
        },
        {
            "id": "elk",
            "label": "ELK Stack",
            "group": "Monitoring",
            "order": 24
        },
        {
            "id": "datadog",
            "label": "Datadog",
            "group": "Monitoring",
            "order": 25
        },
        {
            "id": "nginx",
            "label": "Nginx",
            "group": "Web Servers",
            "order": 26
        },
        {
            "id": "finops",
            "label": "Cloud FinOps",
            "group": "Advanced",
            "order": 27
        }
    ],
    "cyber-security": [
        {
            "id": "it-fundamentals",
            "label": "IT Fundamentals",
            "group": "Foundations",
            "order": 1
        },
        {
            "id": "networking",
            "label": "Networking (TCP/IP)",
            "group": "Foundations",
            "order": 2
        },
        {
            "id": "linux",
            "label": "Linux OS",
            "group": "Foundations",
            "order": 3
        },
        {
            "id": "windows",
            "label": "Windows OS",
            "group": "Foundations",
            "order": 4
        },
        {
            "id": "scripting",
            "label": "Python / Bash Scripting",
            "group": "Programming",
            "order": 5
        },
        {
            "id": "cia",
            "label": "CIA Triad",
            "group": "Core Concepts",
            "order": 6
        },
        {
            "id": "cryptography",
            "label": "Cryptography",
            "group": "Core Concepts",
            "order": 7
        },
        {
            "id": "iam",
            "label": "Identity & Access Mgt",
            "group": "Core Concepts",
            "order": 8
        },
        {
            "id": "risk-mgt",
            "label": "Risk Management",
            "group": "Core Concepts",
            "order": 9
        },
        {
            "id": "siem",
            "label": "SIEM Tools (Splunk)",
            "group": "Defensive Security",
            "order": 10
        },
        {
            "id": "soc",
            "label": "SOC Operations",
            "group": "Defensive Security",
            "order": 11
        },
        {
            "id": "incident-response",
            "label": "Incident Response",
            "group": "Defensive Security",
            "order": 12
        },
        {
            "id": "threat-intel",
            "label": "Threat Intelligence",
            "group": "Defensive Security",
            "order": 13
        },
        {
            "id": "digital-forensics",
            "label": "Digital Forensics",
            "group": "Defensive Security",
            "order": 14
        },
        {
            "id": "ethical-hacking",
            "label": "Ethical Hacking",
            "group": "Offensive Security",
            "order": 15
        },
        {
            "id": "pentest",
            "label": "Penetration Testing",
            "group": "Offensive Security",
            "order": 16
        },
        {
            "id": "vuln-scan",
            "label": "Vulnerability Scanning",
            "group": "Offensive Security",
            "order": 17
        },
        {
            "id": "social-engineering",
            "label": "Social Engineering",
            "group": "Offensive Security",
            "order": 18
        },
        {
            "id": "nmap",
            "label": "Nmap & Wireshark",
            "group": "Tools",
            "order": 19
        },
        {
            "id": "metasploit",
            "label": "Metasploit",
            "group": "Tools",
            "order": 20
        },
        {
            "id": "burp-suite",
            "label": "Burp Suite",
            "group": "Tools",
            "order": 21
        },
        {
            "id": "owasp",
            "label": "OWASP Top 10",
            "group": "AppSec",
            "order": 22
        },
        {
            "id": "comptia-sec",
            "label": "CompTIA Security+",
            "group": "Certifications",
            "order": 23
        },
        {
            "id": "ceh",
            "label": "CEH",
            "group": "Certifications",
            "order": 24
        },
        {
            "id": "cissps",
            "label": "CISSP",
            "group": "Certifications",
            "order": 25
        }
    ],
    "ai-data-scientist": [
        {
            "id": "python",
            "label": "Python / R",
            "group": "Programming",
            "order": 1
        },
        {
            "id": "sql",
            "label": "SQL",
            "group": "Programming",
            "order": 2
        },
        {
            "id": "linear-algebra",
            "label": "Linear Algebra",
            "group": "Math & Stats",
            "order": 3
        },
        {
            "id": "calculus",
            "label": "Calculus",
            "group": "Math & Stats",
            "order": 4
        },
        {
            "id": "statistics",
            "label": "Probability & Statistics",
            "group": "Math & Stats",
            "order": 5
        },
        {
            "id": "hypothesis",
            "label": "Hypothesis Testing",
            "group": "Math & Stats",
            "order": 6
        },
        {
            "id": "pandas",
            "label": "Pandas",
            "group": "Data Manipulation",
            "order": 7
        },
        {
            "id": "numpy",
            "label": "NumPy",
            "group": "Data Manipulation",
            "order": 8
        },
        {
            "id": "matplotlib",
            "label": "Matplotlib / Seaborn",
            "group": "Data Visualization",
            "order": 9
        },
        {
            "id": "tableau",
            "label": "Tableau / PowerBI",
            "group": "Data Visualization",
            "order": 10
        },
        {
            "id": "feature-eng",
            "label": "Feature Engineering",
            "group": "Machine Learning",
            "order": 11
        },
        {
            "id": "supervised",
            "label": "Supervised Learning",
            "group": "Machine Learning",
            "order": 12
        },
        {
            "id": "unsupervised",
            "label": "Unsupervised Learning",
            "group": "Machine Learning",
            "order": 13
        },
        {
            "id": "sklearn",
            "label": "scikit-learn",
            "group": "Machine Learning",
            "order": 14
        },
        {
            "id": "deep-learning",
            "label": "Deep Learning Fundamentals",
            "group": "Advanced ML",
            "order": 15
        },
        {
            "id": "pytorch",
            "label": "PyTorch / TensorFlow",
            "group": "Advanced ML",
            "order": 16
        },
        {
            "id": "nlp",
            "label": "NLP",
            "group": "Advanced ML",
            "order": 17
        },
        {
            "id": "cv",
            "label": "Computer Vision",
            "group": "Advanced ML",
            "order": 18
        },
        {
            "id": "big-data",
            "label": "Hadoop / Spark",
            "group": "Big Data",
            "order": 19
        },
        {
            "id": "data-warehousing",
            "label": "Data Warehousing",
            "group": "Big Data",
            "order": 20
        },
        {
            "id": "mlops",
            "label": "MLOps",
            "group": "Deployment",
            "order": 21
        },
        {
            "id": "mlflow",
            "label": "MLflow",
            "group": "Deployment",
            "order": 22
        },
        {
            "id": "docker",
            "label": "Docker",
            "group": "Deployment",
            "order": 23
        },
        {
            "id": "cloud",
            "label": "AWS / GCP / Azure",
            "group": "Deployment",
            "order": 24
        }
    ],
    "ai-engineer": [
        {
            "id": "python",
            "label": "Python Proficiency",
            "group": "Pre-requisites",
            "order": 1
        },
        {
            "id": "software-eng",
            "label": "Software Engineering Basics",
            "group": "Pre-requisites",
            "order": 2
        },
        {
            "id": "ai-history",
            "label": "History of AI",
            "group": "Concepts",
            "order": 3
        },
        {
            "id": "ai-vs-ml",
            "label": "AI vs ML vs DL",
            "group": "Concepts",
            "order": 4
        },
        {
            "id": "llm",
            "label": "Large Language Models",
            "group": "Core AI",
            "order": 5
        },
        {
            "id": "transformers",
            "label": "Transformers Architecture",
            "group": "Core AI",
            "order": 6
        },
        {
            "id": "tokens",
            "label": "Tokens & Context Window",
            "group": "Core AI",
            "order": 7
        },
        {
            "id": "prompt-eng",
            "label": "Prompt Engineering",
            "group": "Core AI",
            "order": 8
        },
        {
            "id": "few-shot",
            "label": "Few-Shot Prompting",
            "group": "Core AI",
            "order": 9
        },
        {
            "id": "chain-of-thought",
            "label": "Chain of Thought",
            "group": "Core AI",
            "order": 10
        },
        {
            "id": "embeddings",
            "label": "Embeddings",
            "group": "Data & Retrieval",
            "order": 11
        },
        {
            "id": "vector-db",
            "label": "Vector Databases (Pinecone, Milvus)",
            "group": "Data & Retrieval",
            "order": 12
        },
        {
            "id": "rag",
            "label": "RAG Framework",
            "group": "Data & Retrieval",
            "order": 13
        },
        {
            "id": "chunking",
            "label": "Semantic Chunking",
            "group": "Data & Retrieval",
            "order": 14
        },
        {
            "id": "langchain",
            "label": "LangChain",
            "group": "Orchestration",
            "order": 15
        },
        {
            "id": "llamaindex",
            "label": "LlamaIndex",
            "group": "Orchestration",
            "order": 16
        },
        {
            "id": "agents",
            "label": "AI Agents (ReAct)",
            "group": "Orchestration",
            "order": 17
        },
        {
            "id": "fine-tuning",
            "label": "Fine-Tuning (LoRA, QLoRA)",
            "group": "Advanced AI",
            "order": 18
        },
        {
            "id": "rlhf",
            "label": "RLHF",
            "group": "Advanced AI",
            "order": 19
        },
        {
            "id": "evals",
            "label": "LLM Evals",
            "group": "Advanced AI",
            "order": 20
        },
        {
            "id": "api-integration",
            "label": "OpenAI / Anthropic APIs",
            "group": "Deployment",
            "order": 21
        },
        {
            "id": "fastapi",
            "label": "FastAPI",
            "group": "Deployment",
            "order": 22
        },
        {
            "id": "vertex-ai",
            "label": "Cloud AI (Vertex AI, Bedrock)",
            "group": "Deployment",
            "order": 23
        },
        {
            "id": "guardrails",
            "label": "AI Safety & Guardrails",
            "group": "Deployment",
            "order": 24
        }
    ],
    "machine-learning": [
        {
            "id": "python",
            "label": "Python & C++",
            "group": "Programming",
            "order": 1
        },
        {
            "id": "data-structures",
            "label": "Data Structures & Algorithms",
            "group": "Programming",
            "order": 2
        },
        {
            "id": "linear-algebra",
            "label": "Linear Algebra",
            "group": "Math",
            "order": 3
        },
        {
            "id": "calculus",
            "label": "Calculus & Optimization",
            "group": "Math",
            "order": 4
        },
        {
            "id": "statistics",
            "label": "Statistics & Probability",
            "group": "Math",
            "order": 5
        },
        {
            "id": "numpy-pandas",
            "label": "NumPy & Pandas",
            "group": "Data",
            "order": 6
        },
        {
            "id": "data-processing",
            "label": "Data Preprocessing",
            "group": "Data",
            "order": 7
        },
        {
            "id": "feature-eng",
            "label": "Feature Engineering",
            "group": "Data",
            "order": 8
        },
        {
            "id": "supervised",
            "label": "Supervised Learning",
            "group": "Core ML",
            "order": 9
        },
        {
            "id": "unsupervised",
            "label": "Unsupervised Learning",
            "group": "Core ML",
            "order": 10
        },
        {
            "id": "sklearn",
            "label": "scikit-learn",
            "group": "Core ML",
            "order": 11
        },
        {
            "id": "xgboost",
            "label": "XGBoost / LightGBM",
            "group": "Core ML",
            "order": 12
        },
        {
            "id": "neural-networks",
            "label": "Neural Networks",
            "group": "Deep Learning",
            "order": 13
        },
        {
            "id": "pytorch",
            "label": "PyTorch",
            "group": "Deep Learning",
            "order": 14
        },
        {
            "id": "tensorflow",
            "label": "TensorFlow",
            "group": "Deep Learning",
            "order": 15
        },
        {
            "id": "cnn",
            "label": "CNNs (Vision)",
            "group": "Deep Learning",
            "order": 16
        },
        {
            "id": "rnn",
            "label": "RNNs / Transformers (NLP)",
            "group": "Deep Learning",
            "order": 17
        },
        {
            "id": "ml-system-design",
            "label": "ML System Design",
            "group": "MLOps & Deployment",
            "order": 18
        },
        {
            "id": "docker",
            "label": "Docker & Kubernetes",
            "group": "MLOps & Deployment",
            "order": 19
        },
        {
            "id": "model-serving",
            "label": "Model Serving (TorchServe, TF Serving)",
            "group": "MLOps & Deployment",
            "order": 20
        },
        {
            "id": "mlflow",
            "label": "MLflow",
            "group": "MLOps & Deployment",
            "order": 21
        },
        {
            "id": "cloud-ml",
            "label": "AWS SageMaker / GCP Vertex AI",
            "group": "MLOps & Deployment",
            "order": 22
        },
        {
            "id": "monitoring",
            "label": "Model Monitoring & Drift",
            "group": "MLOps & Deployment",
            "order": 23
        }
    ],
    "software-architect": [
        {
            "id": "programming",
            "label": "Deep Programming Mastery",
            "group": "Foundations",
            "order": 1
        },
        {
            "id": "data-structures",
            "label": "Data Structures & Algos",
            "group": "Foundations",
            "order": 2
        },
        {
            "id": "clean-code",
            "label": "Clean Code",
            "group": "Principles",
            "order": 3
        },
        {
            "id": "solid",
            "label": "SOLID Principles",
            "group": "Principles",
            "order": 4
        },
        {
            "id": "dry-kiss",
            "label": "DRY & KISS",
            "group": "Principles",
            "order": 5
        },
        {
            "id": "design-patterns",
            "label": "GoF Design Patterns",
            "group": "Architecture",
            "order": 6
        },
        {
            "id": "enterprise-patterns",
            "label": "Enterprise Architecture Patterns",
            "group": "Architecture",
            "order": 7
        },
        {
            "id": "ddd",
            "label": "Domain Driven Design",
            "group": "Architecture",
            "order": 8
        },
        {
            "id": "monolith",
            "label": "Monolithic Architecture",
            "group": "System Design",
            "order": 9
        },
        {
            "id": "microservices",
            "label": "Microservices",
            "group": "System Design",
            "order": 10
        },
        {
            "id": "serverless",
            "label": "Serverless",
            "group": "System Design",
            "order": 11
        },
        {
            "id": "event-driven",
            "label": "Event-Driven Architecture",
            "group": "System Design",
            "order": 12
        },
        {
            "id": "cap-theorem",
            "label": "CAP Theorem",
            "group": "Distributed Systems",
            "order": 13
        },
        {
            "id": "consistency",
            "label": "Consistency Patterns",
            "group": "Distributed Systems",
            "order": 14
        },
        {
            "id": "api-design",
            "label": "API Design (REST, gRPC, GraphQL)",
            "group": "Communication",
            "order": 15
        },
        {
            "id": "message-brokers",
            "label": "Message Brokers (Kafka, RabbitMQ)",
            "group": "Communication",
            "order": 16
        },
        {
            "id": "relational-db",
            "label": "Relational Databases",
            "group": "Data Storage",
            "order": 17
        },
        {
            "id": "nosql-db",
            "label": "NoSQL Databases",
            "group": "Data Storage",
            "order": 18
        },
        {
            "id": "caching",
            "label": "Caching Strategies (Redis)",
            "group": "Data Storage",
            "order": 19
        },
        {
            "id": "load-balancing",
            "label": "Load Balancing",
            "group": "Scalability",
            "order": 20
        },
        {
            "id": "scaling",
            "label": "Horizontal vs Vertical Scaling",
            "group": "Scalability",
            "order": 21
        },
        {
            "id": "cloud-arch",
            "label": "Cloud Architecture",
            "group": "Infrastructure",
            "order": 22
        },
        {
            "id": "iac",
            "label": "Infrastructure as Code",
            "group": "Infrastructure",
            "order": 23
        },
        {
            "id": "security-arch",
            "label": "Security Architecture",
            "group": "Security",
            "order": 24
        },
        {
            "id": "auth-authz",
            "label": "Authentication & Authorization",
            "group": "Security",
            "order": 25
        },
        {
            "id": "observability",
            "label": "Observability (Logs, Metrics, Traces)",
            "group": "Operations",
            "order": 26
        },
        {
            "id": "leadership",
            "label": "Technical Leadership & Mentoring",
            "group": "Soft Skills",
            "order": 27
        }
    ]
}

SKILL_KEYWORDS = {
    "python": [
        "python",
        "fastapi",
        "flask",
        "django"
    ],
    "javascript": [
        "javascript",
        "js",
        "node",
        "express"
    ],
    "typescript": [
        "typescript",
        "ts"
    ],
    "react": [
        "react",
        "react.js",
        "reactjs"
    ],
    "html": [
        "html",
        "html5",
        "semantic html"
    ],
    "css": [
        "css",
        "css3",
        "tailwind",
        "bootstrap",
        "flexbox",
        "grid"
    ],
    "git": [
        "git",
        "github",
        "gitlab",
        "version control"
    ],
    "docker": [
        "docker",
        "containerization",
        "docker compose"
    ],
    "postgresql": [
        "postgresql",
        "postgres",
        "sql",
        "database"
    ],
    "mongodb": [
        "mongodb",
        "nosql"
    ],
    "mysql": [
        "mysql",
        "mariadb"
    ],
    "redis": [
        "redis",
        "caching"
    ],
    "linux": [
        "linux",
        "ubuntu",
        "bash",
        "terminal",
        "shell",
        "os"
    ],
    "networking": [
        "networking",
        "tcp/ip",
        "cisco",
        "network",
        "dns",
        "http"
    ],
    "rest-api": [
        "rest",
        "api",
        "rest api",
        "rest apis",
        "restful",
        "restful api",
        "restful apis",
        "http"
    ],
    "rest apis": [
        "rest",
        "api",
        "rest api",
        "rest apis",
        "restful",
        "restful api",
        "restful apis",
        "http"
    ],
    "rest api": [
        "rest",
        "api",
        "rest api",
        "rest apis",
        "restful",
        "restful api",
        "restful apis",
        "http"
    ],
    "restful apis": [
        "rest",
        "api",
        "rest api",
        "rest apis",
        "restful",
        "restful api",
        "restful apis",
        "http"
    ],
    "restful api": [
        "rest",
        "api",
        "rest api",
        "rest apis",
        "restful",
        "restful api",
        "restful apis",
        "http"
    ],
    "graphql": [
        "graphql"
    ],
    "aws": [
        "aws",
        "cloud",
        "ec2",
        "s3"
    ],
    "kubernetes": [
        "kubernetes",
        "k8s"
    ],
    "github-actions": [
        "github actions",
        "ci/cd",
        "cicd"
    ],
    "machine learning": [
        "machine learning",
        "ml",
        "sklearn",
        "scikit",
        "supervised",
        "unsupervised"
    ],
    "deep learning": [
        "deep learning",
        "neural network",
        "pytorch",
        "tensorflow",
        "cnn",
        "rnn"
    ],
    "statistics": [
        "statistics",
        "math",
        "linear algebra",
        "calculus",
        "probability"
    ],
    "system design": [
        "system design",
        "architecture",
        "microservices"
    ],
    "security": [
        "security",
        "iam",
        "cryptography",
        "owasp",
        "xss"
    ]
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
    specific_match_score = None

    if career_report and career_report.report_json:
        report = json.loads(career_report.report_json)
        unified_skills = report.get("skill_profile", {}).get("unified_skills", [])
        for match in report.get("career_matches", []):
            if match.get("title") == career_name:
                gap_skills.extend(match.get("gap_skills", []))
                specific_match_score = match.get("match_score")
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

    if specific_match_score is not None:
        readiness_pct = specific_match_score
    else:
        readiness_pct = round((has_count / total) * 100) if total > 0 else 0

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
    # Extract skill names if gap_skills contains dictionaries (Agent 6 output variance)
    gap_skills_lower = [
        (g.get("skill", "") if isinstance(g, dict) else str(g)).lower()
        for g in gap_skills
    ]

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
