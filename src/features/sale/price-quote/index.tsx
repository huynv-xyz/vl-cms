import { useMemo, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { Download, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"
import {
    getPriceQuoteMetadata,
    importPriceQuoteWorkbook,
    listPriceQuoteExportRows,
    listPriceQuotes,
    type PriceQuoteMetadata,
} from "@/api/sale/price-quote"
import { BaseDataTable } from "@/components/table/data-table"
import { PageSection } from "@/components/page-section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { Route } from "@/routes/_authenticated/sales/price-quotes"
import type {
    SalesPriceQuoteFooter,
    SalesPriceQuoteHeader,
    SalesPriceQuoteRow,
    SalesPriceQuoteSheetType,
} from "./data/schema"

const SHEETS: { value: SalesPriceQuoteSheetType; label: string; exportName: string }[] = [
    { value: "KHO_DL", label: "Kho ĐL", exportName: "KHO_DL" },
    { value: "TAI_KHO_VLIFE", label: "Tại kho Vlife", exportName: "TAI KHO VLIFE" },
]
const oneLineCellClass = "overflow-hidden whitespace-nowrap"
const centerCellClass = `${oneLineCellClass} text-center`
const rightCellClass = `${oneLineCellClass} text-right`

export default function PriceQuotePage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()
    const queryClient = useQueryClient()
    const { pagination, setPagination } = useUrlPagination(search, navigate)
    const [uploading, setUploading] = useState(false)
    const [exporting, setExporting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    const metadataQuery = useQuery({
        queryKey: ["sales-price-quotes", "metadata"],
        queryFn: getPriceQuoteMetadata,
    })

    const listParams = {
        page: search.page,
        size: search.size,
        sheetType: search.sheetType,
        keyword: search.keyword,
        productGroupCode: "",
        productGroupName: search.productGroupName,
        minCashPrice: search.minCashPrice,
        maxCashPrice: search.maxCashPrice,
    }

    const { data, isLoading, error } = usePaginatedList(
        ["sales-price-quotes", listParams],
        listPriceQuotes,
        listParams,
        search.size,
        true
    )

    const groupOptions = useMemo(() => buildGroupOptions(metadataQuery.data), [metadataQuery.data])
    const columns = useMemo<ColumnDef<SalesPriceQuoteRow>[]>(() => [
        {
            accessorKey: "display_order",
            header: "STT",
            size: 64,
            cell: ({ row }) => {
                const displayOrder = row.original.display_order
                const value = displayOrder && displayOrder > 0
                    ? displayOrder
                    : pagination.pageIndex * pagination.pageSize + row.index + 1
                return oneLineCell(value, "text-center")
            },
            meta: { tdClassName: centerCellClass },
        },
        {
            accessorKey: "product_name",
            header: "Tên sản phẩm",
            size: 220,
            cell: ({ row }) => oneLineCell(row.original.product_name, "font-medium"),
            meta: { tdClassName: oneLineCellClass },
        },
        {
            accessorKey: "usage_description",
            header: "Công dụng",
            size: 300,
            cell: ({ row }) => oneLineCell(row.original.usage_description),
            meta: { tdClassName: oneLineCellClass },
        },
        {
            accessorKey: "package_size",
            header: "Quy cách",
            size: 96,
            cell: ({ row }) => oneLineCell(row.original.package_size, "text-center"),
            meta: { tdClassName: centerCellClass },
        },
        {
            accessorKey: "unit",
            header: "ĐVT",
            size: 120,
            cell: ({ row }) => oneLineCell(row.original.unit, "text-center"),
            meta: { tdClassName: centerCellClass },
        },
        {
            accessorKey: "origin_or_type",
            header: "Xuất xứ / Loại",
            size: 160,
            cell: ({ row }) => oneLineCell(row.original.origin_or_type, "text-center"),
            meta: { tdClassName: centerCellClass },
        },
        {
            accessorKey: "selling_note",
            header: "Diễn giải",
            size: 180,
            cell: ({ row }) => oneLineCell(row.original.selling_note),
            meta: { tdClassName: oneLineCellClass },
        },
        {
            accessorKey: "cash_price",
            header: "Giá tiền ngay",
            size: 140,
            cell: ({ row }) => oneLineCell(formatMoney(row.original.cash_price), "text-right tabular-nums"),
            meta: { tdClassName: rightCellClass },
        },
        {
            accessorKey: "credit_price_8_10_days",
            header: "Giá 8-10 ngày",
            size: 140,
            cell: ({ row }) => oneLineCell(formatMoney(row.original.credit_price_8_10_days), "text-right tabular-nums"),
            meta: { tdClassName: rightCellClass },
        },
        {
            accessorKey: "credit_price_30_days",
            header: "Giá 30 ngày",
            size: 140,
            cell: ({ row }) => oneLineCell(formatMoney(row.original.credit_price_30_days), "text-right tabular-nums"),
            meta: { tdClassName: rightCellClass },
        },
        {
            accessorKey: "product_group_code",
            header: "Nhóm SP",
            size: 140,
            cell: ({ row }) => oneLineCell(row.original.product_group_code, "text-center"),
            meta: { tdClassName: centerCellClass },
        },
        {
            accessorKey: "product_group_name",
            header: "Tên nhóm",
            size: 180,
            cell: ({ row }) => oneLineCell(row.original.product_group_name, "text-center"),
            meta: { tdClassName: centerCellClass },
        },
    ], [pagination.pageIndex, pagination.pageSize])

    const updateFilter = (patch: Partial<typeof search>) => {
        navigate({
            search: (prev) => ({ ...prev, ...patch, page: 1 }),
            replace: true,
        })
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        try {
            setUploading(true)
            const result = await importPriceQuoteWorkbook(file)
            toast.success(`Đã import ${result.affected} dòng bảng báo giá`)
            await queryClient.invalidateQueries({ queryKey: ["sales-price-quotes"] })
        } catch (err: any) {
            toast.error(err?.message || "Import bảng báo giá thất bại")
        } finally {
            setUploading(false)
            event.target.value = ""
        }
    }

    const handleExport = async () => {
        try {
            setExporting(true)
            const rows = await listPriceQuoteExportRows({
                sheetType: search.sheetType,
                keyword: search.keyword,
                productGroupCode: "",
                productGroupName: search.productGroupName,
                minCashPrice: search.minCashPrice,
                maxCashPrice: search.maxCashPrice,
            })
            await exportPriceQuoteWorkbook(rows, search.sheetType as SalesPriceQuoteSheetType, metadataQuery.data)
        } catch (err: any) {
            toast.error(err?.message || "Xuất Excel thất bại")
        } finally {
            setExporting(false)
        }
    }

    const latestImport = metadataQuery.data?.latest_import

    return (
        <PageSection
            isLoading={isLoading || metadataQuery.isLoading}
            error={error || metadataQuery.error}
            title="Bảng báo giá"
            description="Dữ liệu báo giá tạm thời lấy từ file Excel đã tính sẵn."
            actions={
                <div className="flex items-center gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        Import Excel
                    </Button>
                    <Button variant="outline" onClick={handleExport} disabled={exporting || !data?.items.length}>
                        {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Xuất Excel
                    </Button>
                </div>
            }
            data={data}
        >
            {(pageData) => (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/20 p-3">
                        <Select value={search.sheetType} onValueChange={(value) => updateFilter({ sheetType: value })}>
                            <SelectTrigger className="w-[160px] bg-background">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {SHEETS.map((sheet) => (
                                    <SelectItem key={sheet.value} value={sheet.value}>{sheet.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Input
                            className="h-9 w-[260px] bg-background"
                            placeholder="Tìm SKU, tên sản phẩm, công dụng..."
                            value={search.keyword}
                            onChange={(event) => updateFilter({ keyword: event.target.value })}
                        />

                        <Select value={search.productGroupName || "ALL"} onValueChange={(value) => {
                            updateFilter({
                                productGroupCode: "",
                                productGroupName: value === "ALL" ? "" : value,
                            })
                        }}>
                            <SelectTrigger className="w-[220px] bg-background">
                                <SelectValue placeholder="Nhóm sản phẩm" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Tất cả nhóm</SelectItem>
                                {groupOptions.map((group) => (
                                    <SelectItem key={group} value={group}>
                                        {group}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Input
                            className="h-9 w-[130px] bg-background"
                            inputMode="numeric"
                            placeholder="Giá từ"
                            value={search.minCashPrice}
                            onChange={(event) => updateFilter({ minCashPrice: event.target.value })}
                        />
                        <Input
                            className="h-9 w-[130px] bg-background"
                            inputMode="numeric"
                            placeholder="Giá đến"
                            value={search.maxCashPrice}
                            onChange={(event) => updateFilter({ maxCashPrice: event.target.value })}
                        />

                        {latestImport ? (
                            <Badge variant="outline" className="ml-auto">
                                Import: {formatDateTime(latestImport.imported_at)} · {latestImport.source_file_name}
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="ml-auto">Chưa có dữ liệu import</Badge>
                        )}
                    </div>

                    <BaseDataTable
                        data={pageData.items}
                        columns={columns}
                        pagination={pagination}
                        onPaginationChange={setPagination}
                        pageCount={pageData.total_page}
                        entityName="dòng báo giá"
                        showToolbar={false}
                        enableColumnResize
                        enableStickyHorizontalScroll
                        enableColumnPinning
                        defaultPinnedColumnId="product_name"
                        headerVariant="report"
                        footer={false}
                        showCellBorders
                    />
                </div>
            )}
        </PageSection>
    )
}

function buildGroupOptions(metadata?: PriceQuoteMetadata) {
    const names = new Set<string>()
    for (const item of metadata?.groups ?? []) {
        const name = (item.product_group_name || "").trim()
        if (name) names.add(name)
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, "vi"))
}

function formatMoney(value?: number | null) {
    if (value === null || value === undefined) return ""
    return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Number(value))
}

function formatDateTime(value?: string | null) {
    if (!value) return ""
    const date = new Date(value.replace(" ", "T"))
    if (Number.isNaN(date.getTime())) return value
    return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date)
}

function oneLineCell(value: React.ReactNode, className?: string) {
    return <span className={`block truncate ${className ?? ""}`}>{value || ""}</span>
}

async function exportPriceQuoteWorkbook(
    rows: SalesPriceQuoteRow[],
    sheetType: SalesPriceQuoteSheetType,
    metadata?: PriceQuoteMetadata
) {
    const { Workbook } = await import("exceljs")
    const workbook = new Workbook()
    const sheetMeta = SHEETS.find((item) => item.value === sheetType) ?? SHEETS[0]
    const sheet = workbook.addWorksheet(sheetMeta.exportName)
    const header = metadata?.headers.find((item) => item.sheet_type === sheetType)
    const groupNames = Array.from(new Set(rows.map((row) => row.product_group_name).filter(Boolean))) as string[]
    const footer = selectFooter(metadata?.footers ?? [], sheetType, groupNames)

    sheet.columns = [
        { width: 7 }, { width: 24 }, { width: 42 }, { width: 13 }, { width: 12 },
        { width: 22 }, { width: 18 }, { width: 18 }, { width: 19 }, { width: 18 },
    ]

    sheet.properties.defaultRowHeight = 24
    sheet.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
    sheet.views = [{ state: "frozen", ySplit: 11 }]
    sheet.autoFilter = { from: "A11", to: "J11" }

    sheet.mergeCells("A1:D3")
    sheet.mergeCells("E1:J1")
    sheet.mergeCells("E2:J2")
    sheet.mergeCells("E3:J3")
    sheet.mergeCells("A4:D4")
    sheet.mergeCells("H4:J4")
    sheet.mergeCells("A6:J6")
    sheet.mergeCells("A7:J7")
    sheet.mergeCells("A8:J8")
    sheet.mergeCells("A9:J9")
    sheet.mergeCells("H10:J10")

    await addVlifeLogo(workbook, sheet)

    sheet.getRow(1).height = 28
    sheet.getRow(2).height = 28
    sheet.getRow(3).height = 28
    sheet.getRow(6).height = 46
    sheet.getRow(11).height = 46

    sheet.getCell("E1").value = header?.company_line || "CÔNG TY CỔ PHẦN QUỐC TẾ CUỘC SỐNG VIỆT(VLIFE)"
    sheet.getCell("E2").value = header?.address_line || "Địa chỉ: 160/5 Linh Trung, Phường Linh Xuân, Thành phố Hồ Chí Minh"
    sheet.getCell("E3").value = header?.document_line || "ĐT: 084 283 724 5995; Email: admin@vlife.com.vn; Website: Vlife.com.vn"
    sheet.getCell("A4").value = header?.left_reference || "Số: 07.26-/BGG-VLIFE"
    sheet.getCell("H4").value = header?.right_reference || ""
    sheet.getCell("A6").value = groupNames.length === 1 ? `BẢNG BÁO GIÁ ${groupNames[0].toUpperCase()}` : header?.quote_title || "BẢNG BÁO GIÁ"
    sheet.getCell("A7").value = header?.validity_line || ""
    sheet.getCell("A8").value = header?.greeting_line || "Kính gửi: Quý Khách hàng"
    sheet.getCell("A9").value = header?.intro_line || "Công ty CPQT Cuộc Sống Việt (Vlife) trân trọng gửi đến Quý khách hàng bảng báo giá các sản phẩm như sau:"
    sheet.getCell("H10").value = header?.price_header || "Giá NET theo size chuẩn kg/lít (vnđ)"

    for (const address of ["E1", "E2", "E3"]) {
        sheet.getCell(address).alignment = { horizontal: "right", vertical: "middle", wrapText: true }
        sheet.getCell(address).font = { name: "Times New Roman", size: address === "E1" ? 16 : 11, bold: address === "E1", color: { argb: "FF1F4E79" } }
    }
    sheet.getCell("A4").font = { name: "Times New Roman", size: 11, bold: true }
    sheet.getCell("A4").alignment = { horizontal: "left", vertical: "middle" }
    sheet.getCell("H4").font = { name: "Times New Roman", size: 13, bold: true, italic: true, color: { argb: "FF008080" } }
    sheet.getCell("H4").alignment = { horizontal: "center", vertical: "middle" }

    sheet.getCell("A6").fill = solidFill("FF1F4E79")
    sheet.getCell("A6").font = { name: "Times New Roman", bold: true, size: 22, color: { argb: "FFFFFF00" } }
    sheet.getCell("A6").alignment = { horizontal: "center", vertical: "middle" }
    sheet.getCell("A7").font = { name: "Times New Roman", bold: true, italic: true, size: 12 }
    sheet.getCell("A7").alignment = { horizontal: "center", vertical: "middle" }
    sheet.getCell("A8").font = { name: "Times New Roman", bold: true, italic: true, size: 11 }
    sheet.getCell("A8").alignment = { horizontal: "left", vertical: "middle" }
    sheet.getCell("A9").font = { name: "Times New Roman", bold: true, size: 11, color: { argb: "FF008080" } }
    sheet.getCell("A9").alignment = { horizontal: "left", vertical: "middle", wrapText: true }
    sheet.getCell("H10").font = { name: "Times New Roman", bold: true, size: 16, color: { argb: "FF1F4E79" } }
    sheet.getCell("H10").alignment = { horizontal: "center", vertical: "middle" }

    const headerRow = sheet.getRow(11)
    headerRow.values = [
        "STT", "TÊN SẢN PHẨM", "CÔNG DỤNG", "QUY CÁCH", "ĐVT", sheetType === "KHO_DL" ? "XUẤT XỨ" : "LOẠI",
        "DIỄN_GIẢI", "GIÁ TIỀN NGAY", "GIÁ 8-10 NGÀY", "GIÁ 30 NGÀY",
    ]
    for (let col = 1; col <= 10; col++) {
        const cell = headerRow.getCell(col)
        cell.font = { name: "Times New Roman", bold: true, size: 11, color: { argb: "FF000000" } }
        cell.fill = solidFill("FF2EA79B")
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
        cell.border = darkBorder()
    }

    rows.forEach((row, index) => {
        const excelRow = sheet.getRow(12 + index)
        excelRow.height = 43
        excelRow.values = [
            row.display_order && row.display_order > 0 ? row.display_order : index + 1,
            row.product_name || "",
            row.usage_description || "",
            row.package_size || "",
            row.unit || "",
            row.origin_or_type || "",
            row.selling_note || "",
            row.cash_price ?? null,
            row.credit_price_8_10_days ?? null,
            row.credit_price_30_days ?? null,
        ]
        for (let col = 1; col <= 10; col++) {
            const cell = excelRow.getCell(col)
            cell.border = darkBorder()
            cell.fill = solidFill("FFDDEFEA")
            cell.font = { name: "Times New Roman", size: 12, bold: col === 10 }
            cell.alignment = {
                vertical: "middle",
                wrapText: true,
                horizontal: col >= 8 ? "right" : [1, 4, 5, 6].includes(col) ? "center" : "left",
            }
            if (col >= 8) cell.numFmt = "#,##0"
        }
    })

    const footerStart = 12 + rows.length + 2
    const footerLines = [
        footer?.pricing_note,
        footer?.payment_note,
        footer?.thank_you_note,
        footer?.closing_note,
    ].filter(Boolean) as string[]
    footerLines.forEach((line, idx) => {
        const rowNumber = footerStart + idx
        const row = sheet.getRow(rowNumber)
        row.height = 22
        sheet.mergeCells(`A${rowNumber}:J${rowNumber}`)
        const cell = row.getCell(1)
        cell.value = idx === 0 ? pricingNoteValue(line) : line
        if (idx % 2 === 0) cell.fill = solidFill("FFDDEFEA")
        cell.font = { name: "Times New Roman", size: 11, italic: true, bold: idx === footerLines.length - 1 }
        cell.alignment = { wrapText: true, vertical: "middle", horizontal: "left" }
    })

    const buffer = await workbook.xlsx.writeBuffer()
    downloadBlob(buffer, `bang-bao-gia-${sheetMeta.exportName.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

function selectFooter(footers: SalesPriceQuoteFooter[], sheetType: SalesPriceQuoteSheetType, groupNames: string[]) {
    const sameSheet = footers.filter((item) => item.sheet_type === sheetType)
    if (groupNames.length === 1) {
        return sameSheet.find((item) => item.product_group_name === groupNames[0]) ?? sameSheet[0]
    }
    return sameSheet[0]
}

function thinBorder() {
    return {
        top: { style: "thin" as const, color: { argb: "FFD9E2F3" } },
        left: { style: "thin" as const, color: { argb: "FFD9E2F3" } },
        bottom: { style: "thin" as const, color: { argb: "FFD9E2F3" } },
        right: { style: "thin" as const, color: { argb: "FFD9E2F3" } },
    }
}

function darkBorder() {
    return {
        top: { style: "thin" as const, color: { argb: "FF000000" } },
        left: { style: "thin" as const, color: { argb: "FF000000" } },
        bottom: { style: "thin" as const, color: { argb: "FF000000" } },
        right: { style: "thin" as const, color: { argb: "FF000000" } },
    }
}

function solidFill(argb: string) {
    return { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb } }
}

async function addVlifeLogo(workbook: any, sheet: any) {
    try {
        const logoBuffer = await fetch("/images/cover.png").then((res) => res.arrayBuffer())
        const imageId = workbook.addImage({ buffer: logoBuffer, extension: "png" })
        sheet.addImage(imageId, { tl: { col: 0.05, row: 0.02 }, ext: { width: 215, height: 105 } })
    } catch {
        sheet.getCell("A1").value = "VLIFE"
        sheet.getCell("A1").font = { name: "Times New Roman", size: 28, bold: true, color: { argb: "FF16A99A" } }
        sheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" }
    }
}

function pricingNoteValue(line: string) {
    const vatText = findPricingHighlightText(line)
    if (!vatText) return line
    const vatIndex = line.indexOf(vatText)
    if (vatIndex < 0) return line
    return {
        richText: [
            { text: line.slice(0, vatIndex), font: { name: "Times New Roman", italic: true, size: 11 } },
            { text: vatText, font: { name: "Times New Roman", italic: true, bold: true, underline: true, size: 14, color: { argb: "FFFF0000" } } },
            { text: line.slice(vatIndex + vatText.length), font: { name: "Times New Roman", italic: true, size: 11 } },
        ],
    }
}

function findPricingHighlightText(line: string) {
    const normalizedLine = line.toLocaleLowerCase("vi")
    const candidates = [
        "đã bao gồm VAT, chưa bao gồm vận chuyển",
        "đã bao gồm VAT và vận chuyển",
    ]
    for (const candidate of candidates) {
        const index = normalizedLine.indexOf(candidate.toLocaleLowerCase("vi"))
        if (index >= 0) return line.slice(index, index + candidate.length)
    }
    return null
}

function downloadBlob(buffer: ArrayBuffer, filename: string) {
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
}
