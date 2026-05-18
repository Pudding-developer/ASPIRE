import pandas as pd
import json
import re

def parse_course_sheet(file_path, sheet_name):
    df = pd.read_excel(file_path, sheet_name=sheet_name, header=None)
    
    course_map = {}
    current_course = None
    
    for index, row in df.iterrows():
        # Check if row is mostly NaN or empty
        if row.isna().all():
            continue
            
        first_cell = str(row.iloc[0]).strip()
        
        # Look for a course header
        # E.g. "Course ENGG 401 - Introduction to Engineering..."
        if first_cell.startswith("Course") or re.match(r'^[A-Za-z]+\s+\d+\s+-', first_cell) or (not pd.isna(row.iloc[0]) and pd.isna(row.iloc[1]) and " - " in str(row.iloc[0])):
            # Try to extract course code like "ENGG 401"
            m = re.search(r'(?:Course\s+)?([A-Za-z]+\s+\d+)\s+-', first_cell)
            if m:
                current_course = m.group(1).strip()
                course_map[current_course] = {}
            elif first_cell.startswith("Course"):
                # fallback
                parts = first_cell.replace("Course ", "").split(" - ")
                if len(parts) > 0:
                    current_course = parts[0].strip()
                    course_map[current_course] = {}
            continue
            
        # If we have a current course, try to parse ILOs
        if current_course:
            # Skip header rows
            if "Intended Learning Outcomes" in first_cell or first_cell == "nan":
                continue
                
            # ILO cell typically starts with a number, e.g., "1. Demonstrate..."
            m = re.match(r'^(\d+)\.', first_cell)
            if m:
                ilo_num = int(m.group(1))
                
                try:
                    # Look for SO column and PI column.
                    # Looking at the markdown, SO is in column 1 (0-indexed 1) and PI is in column 3
                    so_cell = str(row.iloc[1]).strip()
                    pi_cell = str(row.iloc[3]).strip()
                    
                    if so_cell and so_cell != "nan" and pi_cell and pi_cell != "nan":
                        try:
                            # In case it has letters like 'SO 5', strip it to int
                            so_val = int(re.sub(r'[^\d]', '', so_cell))
                            
                            if ilo_num not in course_map[current_course]:
                                course_map[current_course][ilo_num] = []
                            
                            course_map[current_course][ilo_num].append({
                                "so": so_val,
                                "pi": pi_cell
                            })
                        except ValueError:
                            pass
                except IndexError:
                    pass

    return course_map

try:
    mapping = parse_course_sheet('backend/Documents/BSCpE_ILO_SO_Fully_Distributed_Final.xlsx', 'BSCpE_ILO_SO_Fully_Distributed_')
    print(json.dumps(mapping, indent=2))
except Exception as e:
    import traceback
    traceback.print_exc()
