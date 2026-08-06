import { useQuery } from "@tanstack/react-query"
import { listAuditLogs } from "@/api/audit-log"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ContractItem } from "../data/schema"

type Props = {
    item: ContractItem
    open: boolean
    onOpenChange: (open: boolean) => void
}

const fields = [
    ["Giá gốc", "unit_price"],
    ["Chiết khấu", "discount_amount"],
    ["Bao bì", "packaging_price"],
    ["Vận chuyển", "freight_price"],
] as const

export function ContractItemPriceHistoryDialog({ item, open, onOpenChange }: Props) {
    const { data = [], isLoading, isError } = useQuery({
        queryKey: ["contract-item-price-history", item.id],
        queryFn: () => listAuditLogs("contract_item", item.id),
        enabled: open,
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Lịch sử sửa giá</DialogTitle>
                    <DialogDescription>
                        {item.product?.code || "Hàng hóa"} — lưu người sửa, thời điểm và giá trị trước/sau.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">Đang tải lịch sử...</div>
                ) : isError ? (
                    <div className="py-8 text-center text-sm text-destructive">Không tải được lịch sử sửa giá.</div>
                ) : data.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">Chưa có lần thay đổi giá nào được ghi nhận.</div>
                ) : (
                    <div className="max-h-[60vh] overflow-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Thời điểm</TableHead>
                                    <TableHead>Người sửa</TableHead>
                                    <TableHead>Nội dung thay đổi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((audit) => {
                                    const oldValues = parseObject(audit.old_values)
                                    const newValues = parseObject(audit.new_values)
                                    const changes = fields.filter(([, key]) => Number(oldValues[key]) !== Number(newValues[key]))
                                    return (
                                        <TableRow key={audit.id}>
                                            <TableCell className="whitespace-nowrap align-top">{formatDateTime(audit.changed_at)}</TableCell>
                                            <TableCell className="whitespace-nowrap align-top">{audit.changed_by_name}</TableCell>
                                            <TableCell className="space-y-1">
                                                {changes.map(([label, key]) => (
                                                    <div key={key}>
                                                        <span className="text-muted-foreground">{label}: </span>
                                                        <span className="line-through">{formatNumber(oldValues[key])}</span>
                                                        <span className="px-2">→</span>
                                                        <span className="font-medium text-emerald-600">{formatNumber(newValues[key])}</span>
                                                    </div>
                                                ))}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

function parseObject(value: Record<string, unknown> | string) {
    if (typeof value !== "string") return (value || {}) as Record<string, number>
    try { return JSON.parse(value) as Record<string, number> } catch { return {} }
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 6 }).format(Number(value || 0))
}

function formatDateTime(value: string) {
    if (!value) return "—"
    const normalized = value.includes("T") ? value : value.replace(" ", "T")
    const date = new Date(normalized)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString("vi-VN")
}
