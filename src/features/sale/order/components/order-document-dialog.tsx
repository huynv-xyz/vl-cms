import type React from "react"
import { useQuery } from "@tanstack/react-query"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { listArLedgerSummary } from "@/api/sale/ar-ledger"
import type { Order } from "../data/schema"

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
                <DialogHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/20 px-5 py-3.5">
                    <DialogTitle className="text-base font-semibold">
                        Đơn đặt hàng
                        {order?.order_no && (
                            <span className="ml-2 font-mono text-primary">{order.order_no}</span>
                        )}
                    </DialogTitle>
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
                <InfoLine label="Địa chỉ:" value={customer?.address || ""} />
                <InfoLine label="Mã số thuế:" value={customer?.tax_code || ""} />
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












