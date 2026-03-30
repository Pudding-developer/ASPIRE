import os
import resend
import asyncio
from string import Template
from app.core.config import RESEND_API_KEY, RESEND_FROM_EMAIL

resend.api_key = RESEND_API_KEY

# __file__ is backend/app/services/email_service.py
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FRONTEND_TEMPLATES_DIR = os.path.join(os.path.dirname(BASE_DIR), "frontend", "src", "email_templates")

def _load_template(filename: str) -> Template:
    filepath = os.path.join(FRONTEND_TEMPLATES_DIR, filename)
    with open(filepath, "r", encoding="utf-8") as f:
        return Template(f.read())

def _build_base_template(content: str) -> str:
    base = _load_template("base.html")
    return base.substitute(content=content)

async def send_instructor_invite(
    to_email: str,
    invite_link: str,
    token: str,
    expires_at: str
) -> bool:
    if not RESEND_API_KEY:
        print(f"Resend API Key not configured. Skipping email to {to_email}")
        return False

    tmpl = _load_template("instructor_invite.html")
    content = tmpl.substitute(invite_link=invite_link, token=token, expires_at=expires_at)
    html = _build_base_template(content)
    
    try:
        await asyncio.to_thread(
            resend.Emails.send,
            {
                "from": RESEND_FROM_EMAIL,
                "to": [to_email],
                "subject": "You've been invited to join ASPIRE as an Instructor",
                "html": html
            }
        )
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False

async def send_student_welcome(
    to_email: str,
    full_name: str
) -> bool:
    if not RESEND_API_KEY:
        print(f"Resend API Key not configured. Skipping email to {to_email}")
        return False

    tmpl = _load_template("student_welcome.html")
    content = tmpl.substitute(full_name=full_name)
    html = _build_base_template(content)
    
    try:
        await asyncio.to_thread(
            resend.Emails.send,
            {
                "from": RESEND_FROM_EMAIL,
                "to": [to_email],
                "subject": "Welcome to ASPIRE — Batangas State University",
                "html": html
            }
        )
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False

async def send_instructor_welcome(
    to_email: str,
    full_name: str
) -> bool:
    if not RESEND_API_KEY:
        print(f"Resend API Key not configured. Skipping email to {to_email}")
        return False

    tmpl = _load_template("instructor_welcome.html")
    content = tmpl.substitute(full_name=full_name)
    html = _build_base_template(content)
    
    try:
        await asyncio.to_thread(
            resend.Emails.send,
            {
                "from": RESEND_FROM_EMAIL,
                "to": [to_email],
                "subject": "Your ASPIRE Instructor Account is Ready",
                "html": html
            }
        )
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False
