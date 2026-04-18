with open("backend/main.py", "r") as f:
    text = f.read()
    
# Check if my debug middleware is there and remove it so it's clean
if "@app.middleware" in text:
    lines = text.split("\n")
    cleaned = []
    skip = False
    for line in lines:
        if line.startswith("@app.middleware"):
            skip = True
        elif skip and line.startswith("@app."):
            skip = False
        
        if not skip: cleaned.append(line)
        
    with open("backend/main.py", "w") as f:
        f.write("\n".join(cleaned))
