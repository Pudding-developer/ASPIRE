import openpyxl
wb = openpyxl.load_workbook('Documents/BSCpE_ILO_Skillset_Alignment.xlsx')
ws = wb["ILO–Skillset Alignment"]
for i, row in enumerate(ws.iter_rows(values_only=True)):
    print(row)
    if i > 20:
        break
