import XLSX from "xlsx"

export const readExcel = async (filePath: string) => {
  const workbook = XLSX.readFile(filePath)
  const sheetName = workbook.SheetNames[0]

  return workbook.Sheets[sheetName]
}

export const getCellsRange = (sheet: XLSX.WorkSheet, range: string) => {
  const cells = XLSX.utils.decode_range(range)
  const data: string[][] = []

  for (let R = cells.s.r; R <= cells.e.r; ++R) {
    const row: string[] = []

    for (let C = cells.s.c; C <= cells.e.c; ++C) {
      const cellAddress = { c: C, r: R }
      const cellRef = XLSX.utils.encode_cell(cellAddress)
      const cell = sheet[cellRef]

      row.push(cell?.v)
    }

    data.push(row)
  }

  return data
}
