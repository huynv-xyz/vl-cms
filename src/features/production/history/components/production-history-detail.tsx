import { Link } from "@tanstack/react-router"
import { Badge } from "@/components/ui/badge"
import type { ProductionHistoryRow } from "../data/schema"
import { formatDate, formatQty, statusLabel } from "./production-history-columns"
import { materialTypeLabel, voucherTypeLabel } from "./production-history-labels"

export function ProductionHistoryDetail({ row }: { row: ProductionHistoryRow }) {
    return (
        <div className="space-y-4 bg-slate-50/70 p-3">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Info label="Lệnh SX" value={row.production_no || `#${row.production_id}`} />
                <Info label="Ngày lệnh" value={formatDate(row.production_date)} />
                <Info label="Bước xử lý" value={statusLabel(row.status)} />
                <Info
                    label="BOM"
                    value={row.bom_id ? (
                        <Link
                            to="/production/boms"
                            search={{
                                page: 1,
                                size: 20,
                                keyword: "",
                                bom_id: row.bom_id,
                                product_id: undefined,
                                active: undefined,
                            }}
                            target="_blank"
                            className="text-primary underline-offset-2 hover:underline"
                        >
                            BOM {row.bom_id}
                        </Link>
                    ) : "-"}
                />
            </div>

            <DetailBlock title="Vật tư sử dụng">
                <div className="overflow-x-auto rounded-md border bg-white">
                    <table className="w-full min-w-[980px] border-collapse text-sm">
                        <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                            <tr>
                                <Th>Vật tư</Th>
                                <Th>Loại</Th>
                                <Th>Kho xuất</Th>
                                <Th right>Định mức</Th>
                                <Th right>SL cần</Th>
                                <Th right>Đã FIFO</Th>
                                <Th right>Thiếu</Th>
                                <Th>Lô FIFO</Th>
                                <Th>Trạng thái</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {row.materials?.length ? row.materials.map((item) => (
                                <tr key={item.id} className="border-t">
                                    <Td>
                                        <div className="font-medium">{item.product_name || "-"}</div>
                                        <div className="text-xs text-muted-foreground">{item.product_code || `#${item.product_id}`}</div>
                                    </Td>
                                    <Td>{materialTypeLabel(item.material_type)}</Td>
                                    <Td>
                                        <div>{item.warehouse_name || "-"}</div>
                                        <div className="text-xs text-muted-foreground">{item.warehouse_code || ""}</div>
                                    </Td>
                                    <Td right>{formatQty(item.quantity_per_unit, item.product_unit)}</Td>
                                    <Td right>{formatQty(item.quantity_required, item.product_unit)}</Td>
                                    <Td right>{formatQty(item.allocated_quantity, item.product_unit)}</Td>
                                    <Td right className={Number(item.shortage_quantity || 0) > 0 ? "font-semibold text-red-600" : undefined}>
                                        {formatQty(item.shortage_quantity, item.product_unit)}
                                    </Td>
                                    <Td>
                                        <div className="flex flex-wrap gap-1">
                                            {item.allocations?.length ? item.allocations.map((allocation) => (
                                                <Badge key={allocation.id} variant="outline" className="font-normal">
                                                    {allocation.lot_no || "-"} · {formatQty(allocation.quantity, item.product_unit)}
                                                </Badge>
                                            )) : <span className="text-muted-foreground">-</span>}
                                        </div>
                                    </Td>
                                    <Td>{item.validation_message || item.fifo_status || "-"}</Td>
                                </tr>
                            )) : (
                                <tr>
                                    <Td colSpan={9} className="text-center text-muted-foreground">
                                        Chưa có vật tư
                                    </Td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </DetailBlock>

            <div className="grid gap-4 xl:grid-cols-2">
                <DetailBlock title="Nhập thành phẩm">
                    <div className="overflow-x-auto rounded-md border bg-white">
                        <table className="w-full min-w-[620px] border-collapse text-sm">
                            <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                                <tr>
                                    <Th>Kho nhập</Th>
                                    <Th>Lô TP</Th>
                                    <Th>HSD</Th>
                                    <Th right>Số lượng</Th>
                                    <Th>Trạng thái</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {row.outputs?.length ? row.outputs.map((output) => (
                                    <tr key={output.id} className="border-t">
                                        <Td>{output.warehouse_name || output.warehouse_code || "-"}</Td>
                                        <Td>{output.lot_no || "-"}</Td>
                                        <Td>{formatDate(output.expiry_date)}</Td>
                                        <Td right>{formatQty(output.quantity, row.product_unit)}</Td>
                                        <Td>{output.status || "-"}</Td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <Td colSpan={5} className="text-center text-muted-foreground">
                                            Chưa nhập thành phẩm
                                        </Td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </DetailBlock>

                <DetailBlock title="Chứng từ liên quan">
                    <div className="overflow-x-auto rounded-md border bg-white">
                        <table className="w-full min-w-[620px] border-collapse text-sm">
                            <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                                <tr>
                                    <Th>Số phiếu</Th>
                                    <Th>Loại</Th>
                                    <Th>Ngày</Th>
                                    <Th>Trạng thái</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {row.vouchers?.length ? row.vouchers.map((voucher) => (
                                    <tr key={voucher.id} className="border-t">
                                        <Td>{voucher.voucher_no || `#${voucher.id}`}</Td>
                                        <Td>{voucherTypeLabel(voucher.operation_code, voucher.voucher_type_code)}</Td>
                                        <Td>{formatDate(voucher.posting_date || voucher.document_date)}</Td>
                                        <Td>{voucher.status || "-"}</Td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <Td colSpan={4} className="text-center text-muted-foreground">
                                            Chưa có chứng từ
                                        </Td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </DetailBlock>
            </div>
        </div>
    )
}

function DetailBlock({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="space-y-2">
            <h3 className="text-sm font-semibold">{title}</h3>
            {children}
        </section>
    )
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="rounded-md border bg-white p-3">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="mt-1 truncate text-sm font-semibold">{value}</div>
        </div>
    )
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
    return <th className={`border-r px-3 py-2 text-left last:border-r-0 ${right ? "text-right" : ""}`}>{children}</th>
}

function Td({
    children,
    right,
    className,
    colSpan,
}: {
    children: React.ReactNode
    right?: boolean
    className?: string
    colSpan?: number
}) {
    return (
        <td
            colSpan={colSpan}
            className={`border-r px-3 py-2 align-top last:border-r-0 ${right ? "text-right tabular-nums" : ""} ${className ?? ""}`}
        >
            {children}
        </td>
    )
}
