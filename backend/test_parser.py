import openpyxl

def parse_curriculum(wb) -> list[dict]:
    ws = wb["BSCpE_ILO_SO_Fully_Distributed_"]
    chunks = []
    current_subject = None
    current_so_list = []
    current_ilos = []

    def flush_subject():
        if current_subject and current_ilos:
            ilo_text = "\n".join([
                f"  ILO: {i['statement']}\n"
                f"    Mapped to SO {i['so']} ({i['pi_level']}): {i['pi_desc']}"
                for i in current_ilos
            ])
            so_text = ", ".join(current_so_list)
            chunks.append({
                "title": current_subject.strip(),
                "content": f"""BSU CpE Subject: {current_subject.strip()}.
Mapped Student Outcomes with Performance Levels: {so_text or 'See ILO details'}.
Intended Learning Outcomes (ILOs) and Performance Indicators:
{ilo_text}
Assessment context: Student scores in these ILOs reflect their mastery of the mapped Student Outcomes at the specified Performance Level (I=Introduced, R=Reinforced, D=Demonstrated).
High ILO scores in this subject predict competency in the mapped skill categories, which in turn align with specific tech career paths."""
            })

    for row in ws.iter_rows(values_only=True):
        r0 = str(row[0]).strip() if row[0] else ''
        
        # Detect subject header: e.g. "Course: GEd 101 - Understanding the Self SOs: SO7(R), SO9(R)"
        if r0.startswith("Course:"):
            flush_subject()
            parts = r0.split("SOs:", 1)
            course_part = parts[0].replace("Course:", "").strip()
            if "-" in course_part:
                current_subject = course_part.split("-", 1)[1].strip()
            else:
                current_subject = course_part
            
            if len(parts) > 1:
                current_so_list = [so.strip() for so in parts[1].split(",")]
            else:
                current_so_list = []
            current_ilos = []
            
        elif r0 and "Intended Learning Outcomes" not in r0 and current_subject:
            ilo_statement = r0
            so_num = str(row[1]).strip() if row[1] else ''
            if so_num.endswith(".0"): so_num = so_num[:-2] # "9.0" -> "9"
            
            so_desc = str(row[2]).strip() if row[2] else ''
            pi_level = str(row[3]).strip() if row[3] else ''
            pi_desc = str(row[4]).strip() if row[4] else ''
            
            if so_num and pi_level:
                current_ilos.append({
                    'statement': ilo_statement,
                    'so': so_num,
                    'pi_level': pi_level,
                    'pi_desc': pi_desc
                })

    flush_subject()
    return chunks

wb = openpyxl.load_workbook('Documents/BSCpE_ILO_SO_Fully_Distributed_Final.xlsx', data_only=True)
chunks = parse_curriculum(wb)
for c in chunks[:2]:
    print("-----")
    print(c['title'])
    print(c['content'])
