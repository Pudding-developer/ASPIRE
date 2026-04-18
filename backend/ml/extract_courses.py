import os
import sys

# Add ml dir to path
sys.path.append(os.path.join(os.getcwd(), 'backend', 'ml'))

try:
    with open('backend/ml/config/targets.py', 'r') as f:
        content = f.read()

    # poor man's parse
    import re
    matches = re.findall(r'"([^"]+)":\s*\[\s*#', content)
    
    with open('backend/ml/training/courses_note.txt', 'w') as f:
        f.write("# ML Course/Subject Targets Dictionary Keys\n\n")
        f.write("Extracted from `backend/ml/config/targets.py`.\n\n")
        for m in sorted(set(matches)):
            f.write(f"- {m}\n")
            
    print(f"Extracted {len(set(matches))} courses successfully based on regex.")
except Exception as e:
    print("Failed", e)
