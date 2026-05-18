import json
import re

# We will run the same parsing logic from parse_excel.py
# and then replace the contents in the JSX file.
import sys
sys.path.append('.')
from parse_excel import parse_course_sheet

mapping = parse_course_sheet('backend/Documents/BSCpE_ILO_SO_Fully_Distributed_Final.xlsx', 'BSCpE_ILO_SO_Fully_Distributed_')

# Generate JS code
js_lines = ["const COURSE_ILO_SO_MAP = {"]
for course, ilos in mapping.items():
    js_lines.append(f'  "{course}": {{')
    for ilo, entries in sorted(ilos.items(), key=lambda x: int(x[0])):
        entries_str = ", ".join([f'{{ so: {e["so"]}, pi: "{e["pi"]}" }}' for e in entries])
        js_lines.append(f'    {ilo}: [{entries_str}],')
    js_lines.append(f'  }},')
js_lines.append("};")

js_code = "\n".join(js_lines)

file_path = 'frontend/src/features/student/performance/views/StudentCourseDetailView.jsx'
with open(file_path, 'r') as f:
    content = f.read()

# Regex to find the constant block
pattern = re.compile(r'const COURSE_ILO_SO_MAP = \{.*?\n\};\n', re.DOTALL)
new_content = pattern.sub(js_code + "\n", content)

with open(file_path, 'w') as f:
    f.write(new_content)

print("Successfully replaced COURSE_ILO_SO_MAP in the JSX file.")
