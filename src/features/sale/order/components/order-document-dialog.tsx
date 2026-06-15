import type React from "react"
import { useQuery } from "@tanstack/react-query"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import type { Borders, Cell, Worksheet } from "exceljs"
import { Button } from "@/components/ui/button"
import { listArLedgerSummary } from "@/api/sale/ar-ledger"
import type { Order } from "../data/schema"
import { Download } from "lucide-react"

type Props = {
    open: boolean
    order?: Order | null
    onClose: () => void
}

export function OrderDocumentDialog({ open, order, onClose }: Props) {
    const customerId = order?.customer_id
    const orderDate = dateToYmd(order?.order_date)
    const arSummaryQuery = useQuery({
        queryKey: ["order-document-ar-summary", customerId, orderDate],
        queryFn: () =>
            listArLedgerSummary({
                page: 1,
                size: 1,
                customer_id: customerId,
                to_date: orderDate,
            }),
        enabled: open && !!customerId,
    })
    const arSummary: any = arSummaryQuery.data
    const debtTotal = Number(arSummary?.items?.[0]?.closing_balance || 0)

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="flex max-h-[92vh] w-[min(96vw,980px)] !max-w-none flex-col gap-0 overflow-hidden p-0">
                <DialogHeader className="flex-row items-center justify-between gap-3 space-y-0 border-b bg-muted/20 px-5 py-3.5 pr-14">
                    <DialogTitle className="text-base font-semibold">
                        Đơn đặt hàng
                        {order?.order_no && (
                            <span className="ml-2 font-mono text-primary">{order.order_no}</span>
                        )}
                    </DialogTitle>
                    {order ? (
                        <Button
                            type="button"
                            size="sm"
                            className="gap-2"
                            onClick={() => void exportOrderDocumentXlsx(order, debtTotal)}
                        >
                            <Download className="h-4 w-4" />
                            Xuất Excel
                        </Button>
                    ) : null}
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-y-auto bg-slate-100 p-5">
                    {order ? (
                        <OrderDocument order={order} debtTotal={debtTotal} />
                    ) : (
                        <div className="py-10 text-center text-sm text-muted-foreground">
                            Không tìm thấy đơn đặt hàng.
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

function OrderDocument({ order, debtTotal }: { order: Order; debtTotal: number }) {
    const customer = order.customer
    const customerInvoiceInfo = getCustomerInvoiceInfo(customer)
    const items = order.items ?? []
    const goodsTotal = items.reduce((sum, item: any) => sum + getLineAmount(item), 0)
    const paymentTotal = goodsTotal + debtTotal

    return (
        <div className="mx-auto min-h-[1120px] w-[850px] max-w-full bg-white p-[10px] font-['Times_New_Roman',serif] text-[16px] leading-tight text-black shadow-sm">
            <div className="flex items-start border-b border-blue-800 px-1 pb-1 pt-1">
                <div className="flex w-[210px] items-center gap-2">
                    <img src="/images/cover.png" alt="VLIFE" className="h-[66px] w-[190px] object-contain object-left" />
                </div>
                <div className="flex-1 text-right text-[16px] leading-snug text-blue-800">
                    <div className="font-bold">CÔNG TY CỔ PHẦN QUỐC TẾ CUỘC SỐNG VIỆT</div>
                    <div>Địa chỉ: 160/5 Linh Trung, Khu Phố 9, Phường Linh Xuân, TP.Hồ Chí Minh</div>
                    <div>ĐT: +84 283 724 5995; Email: admin@vlife.com.vn; website: Vlife.com.vn</div>
                </div>
            </div>

            <div className="relative px-1 pt-1">
                <h1 className="text-center text-[30px] font-bold uppercase">Đơn đặt hàng</h1>
                <div className="absolute right-4 top-12 text-[16px] leading-snug">
                    <div>Ngày: {formatDate(order.order_date)}</div>
                    <div><span>Số: </span><span className="font-bold">{order.order_no}</span></div>
                </div>
            </div>

            <div className="mt-12 space-y-1 px-1 text-[16px]">
                <InfoLine label="Tên khách hàng:" value={customer?.name || "-"} valueClassName="text-[24px] font-bold uppercase text-blue-800" />
                <InfoLine label="Địa chỉ:" value={customerInvoiceInfo.address} />
                <InfoLine label="Mã số thuế:" value={customerInvoiceInfo.taxCode} />
                <InfoLine label="Điện thoại:" value={(customer as any)?.phone || ""} />
                <InfoLine label="Email:" value={(customer as any)?.email || ""} />
                <InfoLine label="Ghi chú:" value={order.note || ""} />
            </div>

            <table className="mt-4 w-full border-collapse text-[16px]">
                <thead>
                    <tr>
                        <Th className="w-[36px]">STT</Th>
                        <Th>Tên hàng</Th>
                        <Th className="w-[88px]">Mô tả</Th>
                        <Th className="w-[52px]">ĐVT</Th>
                        <Th className="w-[58px]">SL</Th>
                        <Th className="w-[88px]">Đơn giá<br />chưa VAT</Th>
                        <Th className="w-[88px]">Đơn giá<br />gồm VAT</Th>
                        <Th className="w-[98px]">Thành tiền<br />gồm VAT</Th>
                        <Th className="w-[110px]">Ghi chú</Th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item: any, index) => (
                        <tr key={item.id ?? `${item.product_id}-${index}`}>
                            <Td className="text-center">{index + 1}</Td>
                            <Td>{item.product?.name || item.product_name || ""}</Td>
                            <Td>{item.description || ""}</Td>
                            <Td className="text-center">{item.product?.unit || item.unit || ""}</Td>
                            <Td className="text-right">{formatQty(item.quantity)}</Td>
                            <Td className="text-right">{formatMoney(getPreVatPrice(item.unit_price))}</Td>
                            <Td className="text-right">{formatMoney(item.unit_price)}</Td>
                            <Td className="text-right">{formatMoney(getLineAmount(item))}</Td>
                            <Td>{lineTypeLabel(item.line_type)}</Td>
                        </tr>
                    ))}
                    <SummaryRow label="Cộng tiền hàng" value={goodsTotal} />
                    <SummaryRow label="Cộng nợ cũ còn nợ" value={debtTotal} />
                    <SummaryRow label="Tổng tiền thanh toán" value={paymentTotal} />
                </tbody>
            </table>

            <div className="px-1 py-5 text-left text-[20px] font-bold italic text-red-600">
                <div>Thời hạn TT:</div>
                <div>- 07 ngày kể từ ngày giao hàng.</div>
                <div>- Sau 07 ngày đơn giá sẽ tăng 300đ/kg theo bảng giá công nợ 30 ngày</div>
            </div>

            <div className="bg-[#a9d18e] px-1 py-2 text-[20px] font-bold leading-snug">
                <div>** Quý khách hàng thanh toán TM hoặc qua tài khoản công ty như sau:</div>
                <div className="pl-3">- Công ty Cổ Phần Quốc Tế Cuộc Sống Việt</div>
                <div className="pl-3">- STK: 3143 171 771</div>
                <div className="pl-3">- Ngân hàng TMCP Đầu tư và Phát Triển Việt Nam BIDV</div>
                <div className="pl-3">- Chi Nhánh Đông Sài Gòn</div>
            </div>
        </div>
    )
}

function InfoLine({ label, value, valueClassName }: { label: string; value: React.ReactNode; valueClassName?: string }) {
    return <div><span>{label} </span><span className={valueClassName}>{value}</span></div>
}

function getCustomerInvoiceInfo(customer: any) {
    const defaultAlias = customer?.default_alias
    return {
        address: defaultAlias?.note || customer?.address || "",
        taxCode: defaultAlias?.tax_code || customer?.tax_code || "",
    }
}

function Th({ className = "", children }: { className?: string; children: React.ReactNode }) {
    return <th className={`border border-black px-1 py-1 text-center align-middle font-bold ${className}`}>{children}</th>
}

function Td({ className = "", children, colSpan }: { className?: string; children?: React.ReactNode; colSpan?: number }) {
    return <td colSpan={colSpan} className={`border border-black px-1 align-top ${className}`}>{children}</td>
}

function SummaryRow({ label, value }: { label: string; value: number }) {
    return (
        <tr className="font-bold">
            <Td className="text-left" colSpan={7}>{label}</Td>
            <Td className="text-right">{formatMoney(value)}</Td>
            <Td />
        </tr>
    )
}

async function exportOrderDocumentXlsx(order: Order, debtTotal: number) {
    const { Workbook } = await import("exceljs")
    const customer = order.customer
    const customerInvoiceInfo = getCustomerInvoiceInfo(customer)
    const items = order.items ?? []
    const goodsTotal = items.reduce((sum, item: any) => sum + getLineAmount(item), 0)
    const paymentTotal = goodsTotal + debtTotal

    const workbook = new Workbook()
    workbook.creator = "VLIFE"
    workbook.created = new Date()
    const sheet = workbook.addWorksheet("Đơn đặt hàng", {
        pageSetup: {
            paperSize: 9,
            orientation: "portrait",
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
            margins: { left: 0.25, right: 0.25, top: 0.35, bottom: 0.35, header: 0.2, footer: 0.2 },
        },
    })

    sheet.columns = [
        { key: "stt", width: 6 },
        { key: "name", width: 42 },
        { key: "description", width: 16 },
        { key: "unit", width: 8 },
        { key: "quantity", width: 11 },
        { key: "preVatPrice", width: 16 },
        { key: "vatPrice", width: 16 },
        { key: "amount", width: 18 },
        { key: "note", width: 18 },
    ]

    sheet.mergeCells("A1:C3")
    sheet.mergeCells("D1:I1")
    sheet.mergeCells("D2:I2")
    sheet.mergeCells("D3:I3")
    sheet.getCell("D1").value = "CÔNG TY CỔ PHẦN QUỐC TẾ CUỘC SỐNG VIỆT"
    sheet.getCell("D2").value = "Địa chỉ: 160/5 Linh Trung, Khu Phố 9, Phường Linh Xuân, TP.Hồ Chí Minh"
    sheet.getCell("D3").value = "ĐT: +84 283 724 5995; Email: admin@vlife.com.vn; website: Vlife.com.vn"
    setBlueCompanyStyle(sheet.getCell("D1"), true)
    setBlueCompanyStyle(sheet.getCell("D2"))
    setBlueCompanyStyle(sheet.getCell("D3"))
    sheet.getRow(1).height = 23
    sheet.getRow(2).height = 20
    sheet.getRow(3).height = 20
    sheet.getRow(3).border = { bottom: { style: "thin", color: { argb: "FF1D4F91" } } }

    try {
        const logoBuffer = await fetch("/images/cover.png").then((res) => res.arrayBuffer())
        const imageId = workbook.addImage({ buffer: logoBuffer, extension: "png" })
        sheet.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 190, height: 66 } })
    } catch {
        sheet.getCell("A1").value = "VLIFE"
        sheet.getCell("A1").font = { name: "Arial", size: 28, bold: true, color: { argb: "FF00A99D" } }
        sheet.getCell("A1").alignment = { vertical: "middle", horizontal: "center" }
    }

    sheet.mergeCells("A5:I5")
    sheet.getCell("A5").value = "ĐƠN ĐẶT HÀNG"
    sheet.getCell("A5").font = { name: "Times New Roman", size: 22, bold: true }
    sheet.getCell("A5").alignment = { horizontal: "center", vertical: "middle" }
    sheet.getRow(5).height = 30
    sheet.getCell("H6").value = "Ngày:"
    sheet.getCell("I6").value = formatDate(order.order_date)
    sheet.getCell("H7").value = "Số:"
    sheet.getCell("I7").value = order.order_no || ""
    sheet.getCell("I7").font = { name: "Times New Roman", size: 12, bold: true }

    const infoRows: Array<[string, string]> = [
        ["Tên khách hàng:", customer?.name || "-"],
        ["Địa chỉ:", customerInvoiceInfo.address],
        ["Mã số thuế:", customerInvoiceInfo.taxCode],
        ["Điện thoại:", (customer as any)?.phone || ""],
        ["Email:", (customer as any)?.email || ""],
        ["Ghi chú:", order.note || ""],
    ]

    infoRows.forEach(([label, value], index) => {
        const rowNumber = 9 + index
        sheet.mergeCells(`A${rowNumber}:I${rowNumber}`)
        const cell = sheet.getCell(`A${rowNumber}`)
        cell.value = {
            richText: [
                {
                    text: `${label} `,
                    font: { name: "Times New Roman", size: 12, color: { argb: "FF000000" } },
                },
                {
                    text: value,
                    font: {
                        name: "Times New Roman",
                        size: index === 0 ? 16 : 12,
                        bold: index === 0,
                        color: index === 0 ? { argb: "FF0050A4" } : { argb: "FF000000" },
                    },
                },
            ],
        }
        cell.alignment = { horizontal: "left", vertical: "middle", wrapText: true }
        sheet.getRow(rowNumber).height = index === 0 ? 28 : Math.max(20, estimateRowHeight(`${label} ${value}`, 120))
    })

    const headerRowNumber = 16
    const headerRow = sheet.getRow(headerRowNumber)
    headerRow.values = [
        "STT",
        "Tên hàng",
        "Mô tả",
        "ĐVT",
        "SL",
        "Đơn giá\nchưa VAT",
        "Đơn giá\ngồm VAT",
        "Thành tiền\ngồm VAT",
        "Ghi chú",
    ]
    headerRow.height = 36
    headerRow.eachCell((cell) => {
        cell.font = { name: "Times New Roman", size: 12, bold: true }
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
        cell.border = allBorders()
    })

    let rowNumber = headerRowNumber + 1
    items.forEach((item: any, index) => {
        const row = sheet.getRow(rowNumber)
        row.values = [
            index + 1,
            item.product?.name || item.product_name || "",
            item.description || "",
            item.product?.unit || item.unit || "",
            Number(item.quantity || 0),
            getPreVatPrice(item.unit_price),
            Number(item.unit_price || 0),
            getLineAmount(item),
            item.note || lineTypeLabel(item.line_type),
        ]
        row.height = Math.max(
            24,
            estimateRowHeight(item.product?.name || item.product_name || "", 38),
            estimateRowHeight(item.description || "", 14),
            estimateRowHeight(item.note || lineTypeLabel(item.line_type), 16),
        )
        row.eachCell((cell, colNumber) => {
            cell.font = { name: "Times New Roman", size: 12 }
            cell.border = allBorders()
            cell.alignment = {
                vertical: "top",
                horizontal: [1, 4].includes(colNumber) ? "center" : colNumber >= 5 && colNumber <= 8 ? "right" : "left",
                wrapText: true,
            }
            if (colNumber >= 5 && colNumber <= 8) {
                cell.numFmt = '#,##0.######'
            }
        })
        rowNumber += 1
    })

    addSummaryExcelRow(sheet, rowNumber++, "Cộng tiền hàng", goodsTotal)
    addSummaryExcelRow(sheet, rowNumber++, "Cộng nợ cũ còn nợ", debtTotal)
    addSummaryExcelRow(sheet, rowNumber++, "Tổng tiền thanh toán", paymentTotal)

    rowNumber += 1
    const redRows = [
        "Thời hạn TT:",
        "- 07 ngày kể từ ngày giao hàng.",
        "- Sau 07 ngày đơn giá sẽ tăng 300đ/kg theo bảng giá công nợ 30 ngày",
    ]
    redRows.forEach((text) => {
        sheet.mergeCells(`A${rowNumber}:I${rowNumber}`)
        const cell = sheet.getCell(`A${rowNumber}`)
        cell.value = text
        cell.font = { name: "Times New Roman", size: 14, bold: true, italic: true, color: { argb: "FFFF0000" } }
        cell.alignment = { horizontal: "left", vertical: "middle" }
        rowNumber += 1
    })

    rowNumber += 1
    const bankRows = [
        "** Quý khách hàng thanh toán TM hoặc qua tài khoản công ty như sau:",
        "- Công ty Cổ Phần Quốc Tế Cuộc Sống Việt",
        "- STK: 3143 171 771",
        "- Ngân hàng TMCP Đầu tư và Phát Triển Việt Nam BIDV",
        "- Chi Nhánh Đông Sài Gòn",
    ]
    bankRows.forEach((text) => {
        sheet.mergeCells(`A${rowNumber}:I${rowNumber}`)
        const cell = sheet.getCell(`A${rowNumber}`)
        cell.value = text
        cell.font = { name: "Times New Roman", size: 14, bold: true }
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFA9D18E" } }
        cell.alignment = { horizontal: "left", vertical: "middle", wrapText: true }
        rowNumber += 1
    })

    sheet.eachRow((row) => {
        row.eachCell((cell) => {
            cell.font = { name: "Times New Roman", size: cell.font?.size || 12, ...cell.font }
        })
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    const safeOrderNo = String(order.order_no || `don-${order.id}`).replace(/[\\/:*?"<>|]/g, "-")
    a.href = url
    a.download = `don-dat-hang-${safeOrderNo}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

function setBlueCompanyStyle(cell: Cell, bold = false) {
    cell.font = { name: "Times New Roman", size: bold ? 13 : 12, bold, color: { argb: "FF0050A4" } }
    cell.alignment = { horizontal: "right", vertical: "middle", wrapText: true }
}

function allBorders(): Partial<Borders> {
    return {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
    }
}

function addSummaryExcelRow(sheet: Worksheet, rowNumber: number, label: string, value: number) {
    sheet.mergeCells(`A${rowNumber}:G${rowNumber}`)
    const labelCell = sheet.getCell(`A${rowNumber}`)
    const valueCell = sheet.getCell(`H${rowNumber}`)
    const noteCell = sheet.getCell(`I${rowNumber}`)

    labelCell.value = label
    valueCell.value = value

    ;[labelCell, valueCell, noteCell].forEach((cell) => {
        cell.font = { name: "Times New Roman", size: 12, bold: true }
        cell.border = allBorders()
        cell.alignment = { vertical: "middle" }
    })
    labelCell.alignment = { horizontal: "left", vertical: "middle" }
    valueCell.alignment = { horizontal: "right", vertical: "middle" }
    valueCell.numFmt = '#,##0.######'
}

function estimateRowHeight(value: unknown, charsPerLine: number) {
    const text = String(value || "")
    if (!text) return 20
    const explicitLines = text.split(/\r?\n/)
    const lineCount = explicitLines.reduce(
        (sum, line) => sum + Math.max(1, Math.ceil(line.length / charsPerLine)),
        0,
    )
    return lineCount * 18
}

function formatDate(value?: string) {
    if (!value) return "-"
    const [date] = value.split("T")
    const normalized = date.replace(/-/g, "/")
    const parts = normalized.split("/")
    if (parts.length === 3 && parts[0].length === 4) return `${parts[2]}/${parts[1]}/${parts[0]}`
    return normalized
}

function dateToYmd(value?: string) {
    if (!value) return undefined
    const [date] = value.split("T")
    const parts = date.includes("/") ? date.split("/") : date.split("-")
    if (parts.length !== 3) return date
    if (parts[0].length === 4) return `${parts[0]}-${parts[1]}-${parts[2]}`
    return `${parts[2]}-${parts[1]}-${parts[0]}`
}

function formatQty(value: unknown) {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(Number(value || 0))
}

function formatMoney(value: unknown) {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Number(value || 0))
}

function getPreVatPrice(value: unknown) {
    return Number(value || 0) / 1.05
}

function getLineAmount(item: any) {
    if (item.line_total != null) return Number(item.line_total || 0)
    const quantity = Number(item.quantity || 0)
    const unitPrice = Number(item.unit_price || 0)
    const discount = Number(item.discount || 0)
    return Math.max(quantity * unitPrice - discount, 0)
}

function lineTypeLabel(value?: string) {
    if (value === "PROMOTION") return "Hàng tặng"
    if (value === "SAMPLE") return "Hàng mẫu"
    return ""
}












