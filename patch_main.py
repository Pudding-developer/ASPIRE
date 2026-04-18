import sys

with open("backend/main.py", "r") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    new_lines.append(line)
    if "app = FastAPI" in line:
        new_lines.append("""
@app.middleware("http")
async def log_requests(request: Request, call_next):
    if "submit" in request.url.path:
        print(f"PATH: {request.url.path}")
        print(f"METHOD: {request.method}")
        print(f"HEADERS: {request.headers}")
    response = await call_next(request)
    return response
""")

with open("backend/main.py", "w") as f:
    f.writelines(new_lines)
