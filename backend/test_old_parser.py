import openpyxl

def parse_curriculum_old(wb):
    ws = wb["ILO–Skillset Alignment"]
    chunks = []
    current_subject = None
    current_so = None
    current_ilos = []

    def flush_subject():
        if current_subject and current_ilos:
            chunks.append(current_subject)

    for row in ws.iter_rows(values_only=True):
        r0 = str(row[0]).strip() if row[0] else ''
        r2 = str(row[2]).strip() if row[2] else ''
        r3 = str(row[3]).strip() if row[3] else ''

        # Detect subject header
        is_subject = (
            row[1] is None and row[2] is None and row[0]
            and 'ILO' not in r0
            and 'BATANGAS' not in r0
            and 'Bachelor' not in r0
            and 'LEGEND' not in r0
            and 'Each ILO' not in r0
            and not r0.startswith('SO')
            and len(r0) > 3
            and '·' in r0
        )

        if is_subject:
            flush_subject()
            current_subject = r0
            current_so = None
            current_ilos = []

        elif r0.startswith('SO') and current_subject:
            current_so = r0.strip()

        elif r2.startswith('ILO') and current_subject and r3:
            current_ilos.append({
                'ilo': r2,
                'statement': r3
            })

    flush_subject()
    return chunks

wb_old = openpyxl.load_workbook('Documents/BSCpE_ILO_Skillset_Alignment (1).xlsx', data_only=True)
chunks = parse_curriculum_old(wb_old)
print(f"Old script chunks generated: {len(chunks)}")
