export type FileCell = string | number | boolean | null | undefined;
function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function exportRows(
  name: string,
  headers: string[],
  rows: FileCell[][],
  format: "csv" | "xlsx",
) {
  if (format === "csv") {
    const cell = (value: FileCell) => {
      let text = String(value ?? "");
      if (typeof value === "string" && /^[=+\-@\t\r]/.test(text.trimStart()))
        text = "'" + text;
      return '"' + text.replaceAll('"', '""') + '"';
    };
    download(
      new Blob(
        [
          "\uFEFF" +
            [headers, ...rows].map((r) => r.map(cell).join(",")).join("\r\n"),
        ],
        { type: "text/csv;charset=utf-8" },
      ),
      name + ".csv",
    );
    return;
  }
  const Excel = (await import("exceljs")).default;
  const book = new Excel.Workbook();
  const sheet = book.addWorksheet("Inventory");
  sheet.addRow(headers);
  rows.forEach((r) => sheet.addRow(r.map((v) => v ?? "")));
  sheet.getRow(1).font = { bold: true };
  sheet.columns.forEach((c) => {
    c.width = 24;
  });
  sheet.columns.forEach((c, i) => {
    if (["Sku", "OrderKey", "Email", "SupplierEmail", "WarehouseName"].includes(headers[i])) c.numFmt = "@";
  });
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(1, rows.length + 1), column: headers.length },
  };
  const bytes = await book.xlsx.writeBuffer();
  download(
    new Blob([new Uint8Array(bytes)], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    name + ".xlsx",
  );
}
function parseCsv(text: string): string[][] {
  const firstLine = text.split(/\r?\n/, 1)[0];
  const delimiter = firstLine.includes(";") && !firstLine.includes(",") ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (quoted || cell === "") quoted = !quoted;
      else throw new Error("CSV: invalid quote / geçersiz tırnak");
    } else if (c === delimiter && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((v) => v.trim())) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
    if (rows.length > 1001)
      throw new Error("Maximum 1000 rows / En fazla 1000 satır");
  }
  if (quoted) throw new Error("CSV: unclosed quote / kapanmamış tırnak");
  row.push(cell);
  if (row.some((v) => v.trim())) rows.push(row);
  return rows;
}
// Bound expanded ZIP sizes before allowing the workbook parser to allocate memory.
function checkArchive(buffer: ArrayBuffer) {
  const view = new DataView(buffer);
  let end = -1;
  for (
    let p = view.byteLength - 22;
    p >= Math.max(0, view.byteLength - 65557);
    p--
  )
    if (view.getUint32(p, true) === 0x06054b50) {
      end = p;
      break;
    }
  if (end < 0) throw new Error("Invalid XLSX / Geçersiz XLSX");
  const count = view.getUint16(end + 10, true);
  let p = view.getUint32(end + 16, true),
    total = 0;
  if (count > 2000)
    throw new Error("Workbook too complex / Dosya çok karmaşık");
  for (let i = 0; i < count; i++) {
    if (p + 46 > view.byteLength || view.getUint32(p, true) !== 0x02014b50)
      throw new Error("Invalid XLSX");
    const size = view.getUint32(p + 24, true);
    total += size;
    if (size > 10 * 1024 * 1024 || total > 25 * 1024 * 1024)
      throw new Error("Workbook too large / Açılmış dosya çok büyük");
    p +=
      46 +
      view.getUint16(p + 28, true) +
      view.getUint16(p + 30, true) +
      view.getUint16(p + 32, true);
  }
}
export async function readImportRows(file: File, expectedHeaders: string[]): Promise<Record<string, string>[]> {
  if (file.size > 1024 * 1024) throw new Error("Maximum 1 MB / En fazla 1 MB");
  let rows: string[][];
  if (file.name.toLowerCase().endsWith(".csv"))
    rows = parseCsv((await file.text()).replace(/^\uFEFF/, ""));
  else if (file.name.toLowerCase().endsWith(".xlsx")) {
    const buffer = await file.arrayBuffer();
    checkArchive(buffer);
    const Excel = (await import("exceljs")).default;
    const book = new Excel.Workbook();
    await book.xlsx.load(buffer);
    const sheet = book.worksheets[0];
    if (!sheet || sheet.rowCount > 1001 || sheet.columnCount > 20)
      throw new Error(
        "Maximum 1000 rows and 20 columns / En fazla 1000 satır, 20 sütun",
      );
    rows = [];
    sheet.eachRow((row) => {
      const values: string[] = [];
      for (let col = 1; col <= sheet.columnCount; col++) {
        const v = row.getCell(col).value;
        if (v !== null && typeof v !== "string" && typeof v !== "number")
          throw new Error(
            "Use plain text cells, no formulas / Formül yerine düz metin kullanın",
          );
        values.push(String(v ?? ""));
      }
      rows.push(values);
    });
  } else throw new Error("Choose CSV or XLSX / CSV veya XLSX seçin");
  const header = rows.shift()?.map((v) => v.trim().toLowerCase()) ?? [];
  if (new Set(header).size !== header.length || expectedHeaders.some(h => !header.includes(h.toLowerCase())) || header.some(h => !expectedHeaders.some(e => e.toLowerCase() === h)))
    throw new Error(`Required columns / Gerekli sütunlar: ${expectedHeaders.join(", ")}`);
  if (rows.length < 1 || rows.length > 1000)
    throw new Error("Provide 1-1000 rows / 1-1000 satır gerekli");
  return rows.map(r => {
    if (r.length > header.length) throw new Error("Extra columns in row / Satırda fazladan sütun var");
    return Object.fromEntries(expectedHeaders.map(h => [h[0].toLowerCase() + h.slice(1), (r[header.indexOf(h.toLowerCase())] ?? "").trim()]));
  });
}
export async function readProducts(file: File): Promise<{ name: string; sku: string }[]> {
  return (await readImportRows(file, ["Name", "Sku"])).map(r => ({ name: r.name, sku: r.sku }));
}
