"""
career_taxonomy_tool.py — CrewAI tool providing Computer Engineering career
taxonomy data (career paths, required skills, industry sectors).
"""
import json

from crewai.tools import BaseTool
from pydantic import BaseModel, Field


CPE_CAREER_TAXONOMY = [
    {
        "title": "Embedded Systems Engineer",
        "sector": "Hardware / IoT",
        "core_skills": [
            "C/C++", "Microcontrollers", "RTOS", "ARM Architecture",
            "Circuit Design", "Debugging Tools", "I2C/SPI/UART",
        ],
        "nice_to_have": ["Rust", "Verilog", "PCB Design", "Linux Kernel"],
        "description": "Designs and programs firmware for embedded devices and microcontroller-based systems.",
    },
    {
        "title": "IoT Solutions Engineer",
        "sector": "IoT / Cloud",
        "core_skills": [
            "Embedded C", "MQTT", "Python", "Cloud Platforms (AWS IoT / Azure IoT)",
            "Sensor Integration", "Networking Protocols", "Edge Computing",
        ],
        "nice_to_have": ["Docker", "Node-RED", "TinyML", "LoRaWAN"],
        "description": "Builds end-to-end IoT systems connecting hardware sensors to cloud analytics.",
    },
    {
        "title": "FPGA / Hardware Design Engineer",
        "sector": "Semiconductor / Hardware",
        "core_skills": [
            "Verilog", "VHDL", "FPGA Development", "Digital Logic Design",
            "Timing Analysis", "Simulation Tools", "SystemVerilog",
        ],
        "nice_to_have": ["ASIC Design", "High-Level Synthesis", "PCB Layout", "Signal Processing"],
        "description": "Designs and verifies digital circuits using HDLs and FPGA platforms.",
    },
    {
        "title": "Network Engineer",
        "sector": "Telecommunications / IT",
        "core_skills": [
            "TCP/IP", "Routing & Switching", "Network Security", "Linux Administration",
            "Firewall Configuration", "VLAN/Subnetting", "Wireshark",
        ],
        "nice_to_have": ["SDN", "Python Scripting", "Cloud Networking", "CCNA/CCNP"],
        "description": "Designs, deploys, and maintains enterprise and telecommunications networks.",
    },
    {
        "title": "Cybersecurity Engineer",
        "sector": "Security",
        "core_skills": [
            "Network Security", "Penetration Testing", "SIEM Tools",
            "Cryptography", "Linux", "Incident Response", "Vulnerability Assessment",
        ],
        "nice_to_have": ["Python", "Reverse Engineering", "Cloud Security", "Compliance Frameworks"],
        "description": "Protects systems and networks from security threats through proactive defense.",
    },
    {
        "title": "Software Engineer",
        "sector": "Software / Tech",
        "core_skills": [
            "Data Structures & Algorithms", "Python", "JavaScript/TypeScript",
            "Git", "REST APIs", "SQL", "Software Design Patterns",
        ],
        "nice_to_have": ["React", "Node.js", "Docker", "CI/CD", "Cloud Services", "System Design"],
        "description": "Designs and builds software applications across the full stack.",
    },
    {
        "title": "Machine Learning Engineer",
        "sector": "AI / Data Science",
        "core_skills": [
            "Python", "Machine Learning Algorithms", "TensorFlow/PyTorch",
            "Data Preprocessing", "Linear Algebra", "Statistics", "Model Evaluation",
        ],
        "nice_to_have": ["Deep Learning", "NLP", "Computer Vision", "MLOps", "Cloud ML Services"],
        "description": "Develops and deploys machine learning models for real-world applications.",
    },
    {
        "title": "Robotics Engineer",
        "sector": "Robotics / Automation",
        "core_skills": [
            "C/C++", "ROS", "Control Systems", "Sensor Fusion",
            "Kinematics", "Embedded Systems", "Python",
        ],
        "nice_to_have": ["Computer Vision", "SLAM", "PLC Programming", "Simulation (Gazebo)"],
        "description": "Designs and programs robotic systems combining hardware and software.",
    },
    {
        "title": "Telecommunications Engineer",
        "sector": "Telecommunications",
        "core_skills": [
            "Signal Processing", "RF Engineering", "Antenna Design",
            "Communication Protocols", "MATLAB", "Network Planning", "5G/LTE",
        ],
        "nice_to_have": ["Python", "SDR", "Fiber Optics", "Satellite Communications"],
        "description": "Designs and optimizes communication systems and signal transmission infrastructure.",
    },
    {
        "title": "DevOps / Cloud Engineer",
        "sector": "Cloud / Infrastructure",
        "core_skills": [
            "Linux", "Docker", "CI/CD Pipelines", "Cloud Platforms (AWS/GCP/Azure)",
            "Infrastructure as Code", "Monitoring & Logging", "Git",
        ],
        "nice_to_have": ["Kubernetes", "Terraform", "Ansible", "Python/Bash Scripting"],
        "description": "Automates infrastructure, deployments, and operations for scalable cloud systems.",
    },
]


class CareerTaxonomyInput(BaseModel):
    query: str = Field(
        default="all",
        description="Filter careers: 'all' returns every path, or provide a sector/keyword to filter.",
    )


class CareerTaxonomyTool(BaseTool):
    name: str = "career_taxonomy"
    description: str = (
        "Provides Computer Engineering career paths with required skills, "
        "nice-to-have skills, and sector information. Use query='all' to "
        "get every career path, or provide a keyword to filter by sector or title."
    )
    args_schema: type[BaseModel] = CareerTaxonomyInput

    def _run(self, query: str = "all") -> str:
        if query == "all":
            return json.dumps(CPE_CAREER_TAXONOMY, indent=2)

        keyword = query.lower()
        filtered = [
            c for c in CPE_CAREER_TAXONOMY
            if keyword in c["title"].lower() or keyword in c["sector"].lower()
        ]
        if not filtered:
            return json.dumps(CPE_CAREER_TAXONOMY, indent=2)
        return json.dumps(filtered, indent=2)
