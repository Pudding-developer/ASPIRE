import ast
import re
import openpyxl

wb = openpyxl.load_workbook('Documents/BSCpE_ILO_SO_Fully_Distributed_Final.xlsx', data_only=True)
ws = wb["BSCpE_ILO_SO_Fully_Distributed_"]

subject_to_sos = {}
for row in ws.iter_rows(values_only=True):
    r0 = str(row[0]).strip() if row[0] else ''
    if r0.startswith("Course:"):
        parts = r0.split("SOs:", 1)
        course_part = parts[0].replace("Course:", "").strip()
        if "-" in course_part:
            subject = course_part.split("-", 1)[1].strip()
        else:
            subject = course_part
            
        if len(parts) > 1:
            sos = [so.strip() for so in parts[1].split(",")]
        else:
            sos = []
        subject_to_sos[subject.lower()] = sos

# Read subject_skill_map.py
with open('app/ai/data/subject_skill_map.py', 'r') as f:
    content = f.read()

def replace_sos(match):
    idx = match.start()
    lines = content[:idx].split('\n')
    subj = None
    for line in reversed(lines):
        m = re.match(r'\s*"([^"]+)":\s*{', line)
        if m:
            subj = m.group(1)
            break
            
    if not subj:
        return match.group(0)
    
    # Fuzzy match subject to get new SOs
    subj_lower = subj.lower()
    new_sos = []
    
    # exact match
    if subj_lower in subject_to_sos:
        new_sos = subject_to_sos[subj_lower]
    else:
        # partial match
        for k, v in subject_to_sos.items():
            if subj_lower in k or k in subj_lower:
                new_sos = v
                break
        
        # if still empty, use keyword match
        if not new_sos:
            keywords = {
                "programming": "object oriented programming",
                "network": "introduction to networks",
                "data structure": "data structures",
                "algorithm": "data structures",
                "operating system": "operating systems",
                "machine learning": "data mining",
                "database": "software design",
                "embedded": "embedded systems",
                "microprocessor": "microprocessors",
                "calculus": "differential calculus",
                "signal": "digital signal processing",
                "circuit": "logic circuits",
                "cpe practice": "cpe practice and design",
                "cad": "computer-aided design"
            }
            for kw, mapped in keywords.items():
                if kw in subj_lower:
                    for k, v in subject_to_sos.items():
                        if mapped in k:
                            new_sos = v
                            break
                    break
                    
    if new_sos:
        # Check if they look like "SO1(I)" instead of "SO1 (I)"
        # But whatever is extracted from Excel is fine. 
        # But wait, it's a python list of strings
        sos_str = repr(new_sos)
        # Convert ['SO7(R)', 'SO9(R)'] to double quotes for consistency
        sos_str = sos_str.replace("'", '"')
        return f'"abet_sos": {sos_str}'
    else:
        return match.group(0)

new_content = re.sub(r'"abet_sos":\s*\[.*?\]', replace_sos, content, flags=re.DOTALL)

with open('app/ai/data/subject_skill_map.py', 'w') as f:
    f.write(new_content)
    
print("Updated subject_skill_map.py")
