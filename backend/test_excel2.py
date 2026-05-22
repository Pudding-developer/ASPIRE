import openpyxl
wb = openpyxl.load_workbook('Documents/BSCpE_ILO_SO_Fully_Distributed_Final.xlsx', data_only=True)
ws = wb["SO Legend"]
for i, row in enumerate(ws.iter_rows(values_only=True)):
    print(row)
    if i > 5:
        break
