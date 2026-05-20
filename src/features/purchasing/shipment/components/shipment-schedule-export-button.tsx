import { Button } from "@/components/ui/button"
import {
    listShipmentItems,
    type ShipmentItemListParams,
} from "@/api/purchasing/shipment_items"
import { Download } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import type { ShipmentItem } from "../../shipment-item/data/schema"

export type ShipmentScheduleExportParams = Omit<
    ShipmentItemListParams,
    "page" | "size"
>

type Props = {
    params: ShipmentScheduleExportParams
}

export function ShipmentScheduleExportButton({ params }: Props) {
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = async () => {
        try {
            setIsExporting(true)
            const items = await fetchAllShipmentItems(params)

            if (!items.length) {
                toast.info("Không có dữ liệu để xuất")
                return
            }

            exportShipmentScheduleExcel(items)
            toast.success(`Đã xuất ${items.length} dòng`)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Xuất Excel thất bại")
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <Button
            type="button"
            variant="outline"
            disabled={isExporting}
            onClick={handleExport}
        >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Đang xuất..." : "Xuất Excel"}
        </Button>
    )
}

async function fetchAllShipmentItems(params: ShipmentScheduleExportParams) {
    const size = 200
    let page = 1
    let totalPage = 1
    const items: ShipmentItem[] = []

    do {
        const result = await listShipmentItems({
            ...params,
            page,
            size,
        })

        items.push(...(result.items ?? []))
        totalPage = result.total_page || 1
        page += 1
    } while (page <= totalPage)

    return items
}

function exportShipmentScheduleExcel(items: ShipmentItem[]) {
    const today = new Date()
    const titleDate = today.toLocaleDateString("vi-VN")
    const fileDate = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0"),
    ].join("-")

    const sortedItems = [...items].sort((a, b) => {
        const groupCompare = getProductGroupName(a).localeCompare(
            getProductGroupName(b),
            "vi",
        )
        if (groupCompare !== 0) return groupCompare

        const dateCompare = String(a.shipment?.eta ?? "").localeCompare(
            String(b.shipment?.eta ?? ""),
        )
        if (dateCompare !== 0) return dateCompare

        return String(a.product?.name ?? "").localeCompare(
            String(b.product?.name ?? ""),
            "vi",
        )
    })

    let lastGroupName = ""
    const rows = sortedItems
        .map((item) => {
            const groupName = getProductGroupName(item)
            const displayGroupName = groupName === lastGroupName ? "" : groupName
            const realQuantity = Math.max(
                Number(item.quantity ?? 0) - Number(item.defect_quantity ?? 0),
                0,
            )
            lastGroupName = groupName

            return `
                <tr>
                    <td>${escapeHtml(displayGroupName)}</td>
                    <td>${escapeHtml(item.product?.name || "")}</td>
                    <td>${escapeHtml(item.product?.unit || "")}</td>
                    <td class="date-text">${escapeHtml(formatDate(item.shipment?.etd))}</td>
                    <td class="date-text">${escapeHtml(formatDate(item.shipment?.eta))}</td>
                    <td>${escapeHtml(item.shipment?.destination_port?.name || "")}</td>
                    <td>${escapeHtml(formatNumberForExcel(realQuantity))}</td>
                    <td>${escapeHtml(formatStatus(item.shipment?.status))}</td>
                    <td>${escapeHtml(item.note || item.shipment?.note || "")}</td>
                </tr>`
        })
        .join("")

    const html = `
        <html>
            <head>
                <meta charset="utf-8" />
                <style>
                    table { border-collapse: collapse; font-family: Arial, sans-serif; }
                    th, td { border: 1px solid #000; padding: 6px; vertical-align: top; }
                    th { font-weight: bold; text-align: center; background: #f2f2f2; }
                    .title { font-size: 16px; font-weight: bold; text-align: center; }
                    .number { text-align: right; }
                    .date-text { mso-number-format: "\\@"; }
                </style>
            </head>
            <body>
                <table>
                    <tr>
                        <td class="title" colspan="9">LỊCH HÀNG VỀ DỰ KIẾN CẬP NHẬT NGÀY ${escapeHtml(titleDate)}</td>
                    </tr>
                    <tr>
                        <th>Loại</th>
                        <th>Tên hàng</th>
                        <th>ĐVT</th>
                        <th>Ngày đi</th>
                        <th>Ngày đến</th>
                        <th>Cảng đến</th>
                        <th>SL Nhập</th>
                        <th>Tình trạng hàng</th>
                        <th>Ghi chú</th>
                    </tr>
                    ${rows}
                </table>
            </body>
        </html>`

    const blob = new Blob(["\ufeff", html], {
        type: "application/vnd.ms-excel;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = `lich-hang-ve-du-kien-${fileDate}.xls`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
}

function getProductGroupName(item: ShipmentItem) {
    return (
        item.product?.group?.name ||
        item.product?.group_name ||
        item.product?.group_code ||
        "Chưa phân loại"
    )
}

function formatStatus(status?: string) {
    switch (status) {
        case "IN_TRANSIT":
            return "Đang vận chuyển"
        case "ARRIVED_PORT":
            return "Đã cập cảng"
        case "IN_WAREHOUSE":
            return "Đã về kho"
        case "DONE":
            return "Hoàn tất"
        case "CANCELLED":
            return "Đã hủy"
        default:
            return status || "—"
    }
}

function formatDate(value?: string) {
    if (!value) return ""

    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (match) {
        return `${match[3]}/${match[2]}/${match[1]}`
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value

    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
}

function formatNumberForExcel(value: number) {
    return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(4)))
}

function escapeHtml(value: string | number | null | undefined) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
}
