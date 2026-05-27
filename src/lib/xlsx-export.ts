export type XlsxCell = string | number

export type XlsxSheet = {
    name: string
    rows: XlsxCell[][]
}

type ZipEntry = {
    name: string
    data: Uint8Array
    crc: number
}

const encoder = new TextEncoder()
const CRC_TABLE = makeCrcTable()

export function exportXlsx(filename: string, sheets: XlsxSheet[]) {
    const entries = buildWorkbookEntries(sheets)
    const blob = new Blob([zip(entries)], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

function buildWorkbookEntries(sheets: XlsxSheet[]): ZipEntry[] {
    const normalizedSheets = sheets.length ? sheets : [{ name: "Sheet1", rows: [] }]

    return [
        file("[Content_Types].xml", contentTypes(normalizedSheets.length)),
        file("_rels/.rels", rootRelationships()),
        file("xl/workbook.xml", workbook(normalizedSheets)),
        file("xl/_rels/workbook.xml.rels", workbookRelationships(normalizedSheets.length)),
        ...normalizedSheets.map((sheet, index) =>
            file(`xl/worksheets/sheet${index + 1}.xml`, worksheet(sheet.rows)),
        ),
    ]
}

function file(name: string, text: string): ZipEntry {
    const data = encoder.encode(text)
    return { name, data, crc: crc32(data) }
}

function contentTypes(sheetCount: number) {
    const sheetOverrides = Array.from({ length: sheetCount }, (_, index) =>
        `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
    ).join("")

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${sheetOverrides}
</Types>`
}

function rootRelationships() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
}

function workbook(sheets: XlsxSheet[]) {
    const sheetTags = sheets.map((sheet, index) =>
        `<sheet name="${xmlAttr(sheet.name || `Sheet${index + 1}`)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`,
    ).join("")

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>${sheetTags}</sheets>
</workbook>`
}

function workbookRelationships(sheetCount: number) {
    const relationships = Array.from({ length: sheetCount }, (_, index) =>
        `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`,
    ).join("")

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${relationships}
</Relationships>`
}

function worksheet(rows: XlsxCell[][]) {
    const rowTags = rows.map((row, rowIndex) => {
        const cells = row.map((cell, colIndex) => cellXml(cell, rowIndex + 1, colIndex + 1)).join("")
        return `<row r="${rowIndex + 1}">${cells}</row>`
    }).join("")

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetData>${rowTags}</sheetData>
</worksheet>`
}

function cellXml(value: XlsxCell, row: number, col: number) {
    const ref = `${columnName(col)}${row}`
    if (typeof value === "number" && Number.isFinite(value)) {
        return `<c r="${ref}"><v>${value}</v></c>`
    }
    return `<c r="${ref}" t="inlineStr"><is><t>${xmlText(String(value ?? ""))}</t></is></c>`
}

function columnName(index: number) {
    let name = ""
    let value = index
    while (value > 0) {
        value -= 1
        name = String.fromCharCode(65 + (value % 26)) + name
        value = Math.floor(value / 26)
    }
    return name
}

function zip(entries: ZipEntry[]) {
    const chunks: Uint8Array[] = []
    const centralDirectory: Uint8Array[] = []
    let offset = 0

    for (const entry of entries) {
        const name = encoder.encode(entry.name)
        const localHeader = concat(
            u32(0x04034b50),
            u16(20),
            u16(0x0800),
            u16(0),
            u16(0),
            u16(0),
            u32(entry.crc),
            u32(entry.data.length),
            u32(entry.data.length),
            u16(name.length),
            u16(0),
            name,
        )
        chunks.push(localHeader, entry.data)

        centralDirectory.push(concat(
            u32(0x02014b50),
            u16(20),
            u16(20),
            u16(0x0800),
            u16(0),
            u16(0),
            u16(0),
            u32(entry.crc),
            u32(entry.data.length),
            u32(entry.data.length),
            u16(name.length),
            u16(0),
            u16(0),
            u16(0),
            u16(0),
            u32(0),
            u32(offset),
            name,
        ))
        offset += localHeader.length + entry.data.length
    }

    const centralOffset = offset
    const central = concat(...centralDirectory)
    const end = concat(
        u32(0x06054b50),
        u16(0),
        u16(0),
        u16(entries.length),
        u16(entries.length),
        u32(central.length),
        u32(centralOffset),
        u16(0),
    )

    return concat(...chunks, central, end)
}

function u16(value: number) {
    return new Uint8Array([value & 0xff, (value >> 8) & 0xff])
}

function u32(value: number) {
    return new Uint8Array([
        value & 0xff,
        (value >> 8) & 0xff,
        (value >> 16) & 0xff,
        (value >> 24) & 0xff,
    ])
}

function concat(...arrays: Uint8Array[]) {
    const length = arrays.reduce((sum, array) => sum + array.length, 0)
    const result = new Uint8Array(length)
    let offset = 0
    for (const array of arrays) {
        result.set(array, offset)
        offset += array.length
    }
    return result
}

function crc32(data: Uint8Array) {
    let crc = 0xffffffff
    for (const byte of data) {
        crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
    }
    return (crc ^ 0xffffffff) >>> 0
}

function makeCrcTable() {
    const table = new Uint32Array(256)
    for (let i = 0; i < 256; i++) {
        let crc = i
        for (let j = 0; j < 8; j++) {
            crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1
        }
        table[i] = crc >>> 0
    }
    return table
}

function xmlText(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
}

function xmlAttr(value: string) {
    return xmlText(value).replace(/"/g, "&quot;")
}
