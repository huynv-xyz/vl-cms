import { formatNumber } from "@/lib/utils"
import type { InventoryVoucherPrintDetail } from "@/api/inventory/voucher"
import { ExportInfo } from "@/features/sale/export-detail/components/export-info"
import { ExportItems } from "@/features/sale/export-detail/components/export-items"
import type { Export } from "@/features/sale/export/data/schema"
import type { Return } from "@/features/sale/return/data/schema"

/** Shared print layout for every warehouse voucher template. */
export const WAREHOUSE_VOUCHER_PRINT_CSS = `@media print {
  @page { margin: 5mm; }
  html, body { height: auto !important; overflow: visible !important; }
  body > * { display: none !important; }
  body > #warehouse-voucher-print { display: block !important; width: 100% !important; margin: 0 !important; padding: 0 !important; font-size: 10px !important; }
  #warehouse-voucher-print > div { padding: 4mm !important; }
  #warehouse-voucher-print .export-print-company { margin-bottom: 2px !important; }
  #warehouse-voucher-print .export-print-company > div:first-child { font-size: 11px !important; }
  #warehouse-voucher-print .export-print-title { margin-top: -4px !important; font-size: 17px !important; }
  #warehouse-voucher-print .export-print-info-lines { margin-top: -3px !important; padding-top: 3px !important; padding-bottom: 3px !important; font-size: 10px !important; }
  #warehouse-voucher-print table { font-size: 10px !important; line-height: 1.15 !important; }
  #warehouse-voucher-print th, #warehouse-voucher-print td { padding: 2px !important; vertical-align: middle !important; }
  #warehouse-voucher-print .export-print-note { padding-top: 3px !important; padding-bottom: 3px !important; font-size: 9px !important; }
  #warehouse-voucher-print .export-print-signatures { padding-top: 3px !important; padding-bottom: 3px !important; }
  #warehouse-voucher-print .export-print-sign-date { margin-bottom: 6px !important; }
  #warehouse-voucher-print .export-print-sign-space { margin-top: 50px !important; }
  #warehouse-voucher-print .export-print-hide { display: none !important; }
  #warehouse-voucher-print .export-print-footer { display: table-row !important; }
  #warehouse-voucher-print .export-screen-footer { display: none !important; }
}`

/** Administrative detail view. This deliberately differs from the printable certificate. */
export function WarehouseVoucherDetail({ voucher }: { voucher: InventoryVoucherPrintDetail }) {
    const items = voucher.items ?? []
    const warehouse = voucher.physical_warehouse?.name || voucher.warehouse?.name || "-"
    const documentDate = formatDate(voucher.document_date || voucher.posting_date)
    const documentTime = voucher.document_time || voucher.posting_time
    const totalQuantity = items.reduce((total, item) => total + Number(item.quantity || 0), 0)
    return <div className="space-y-5 p-1">
        <div className="grid gap-x-6 gap-y-3 rounded-lg border bg-muted/20 p-4 text-sm md:grid-cols-2 xl:grid-cols-3">
            <DetailItem label="Mã chứng từ kho" value={voucher.voucher_no || "-"} mono />
            <DetailItem label="Loại nghiệp vụ" value={voucher.type?.name || voucher.voucher_type_code || "-"} />
            <DetailItem label="Ngày giờ chứng từ" value={documentTime ? `${documentDate} ${documentTime}` : documentDate} />
            <DetailItem label="Địa điểm kho" value={warehouse} />
            <DetailItem label="Chứng từ nguồn" value={voucher.source_document_no || "-"} mono />
            <DetailItem label="Diễn giải" value={voucher.description || "-"} />
        </div>
        <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
                <thead className="bg-muted/60"><tr>
                    <th className="w-14 px-3 py-2.5 text-center font-medium">STT</th><th className="px-3 py-2.5 text-left font-medium">Mã hàng</th><th className="px-3 py-2.5 text-left font-medium">Tên hàng hóa</th><th className="px-3 py-2.5 text-left font-medium">ĐVT</th><th className="px-3 py-2.5 text-right font-medium">Số lượng</th><th className="px-3 py-2.5 text-left font-medium">Kho</th><th className="px-3 py-2.5 text-left font-medium">Lô</th><th className="px-3 py-2.5 text-left font-medium">Lý do chọn lô</th><th className="px-3 py-2.5 text-left font-medium">Ghi chú</th>
                </tr></thead>
                <tbody>{items.length ? items.map((item, index) => <tr key={`${item.id}-${index}`} className="border-t"><td className="px-3 py-2 text-center">{index + 1}</td><td className="px-3 py-2 font-mono text-xs">{item.product?.code || "-"}</td><td className="px-3 py-2">{item.product?.name || "-"}</td><td className="px-3 py-2">{item.unit || item.product?.unit || "-"}</td><td className="px-3 py-2 text-right font-medium tabular-nums">{formatNumber(Number(item.quantity || 0))}</td><td className="px-3 py-2">{item.warehouse?.name || item.warehouse?.code || "-"}</td><td className="px-3 py-2 font-mono text-xs">{item.lot_code || "-"}</td><td className="px-3 py-2">{item.lot_selection_reason || "-"}</td><td className="px-3 py-2">{item.note || "-"}</td></tr>) : <tr><td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">Chưa có dòng hàng hóa</td></tr>}</tbody>
                <tfoot className="border-t bg-muted/30"><tr><td colSpan={4} className="px-3 py-2.5 text-right font-semibold">Tổng số lượng</td><td className="px-3 py-2.5 text-right font-semibold tabular-nums">{formatNumber(totalQuantity)}</td><td colSpan={4} /></tr></tfoot>
            </table>
        </div>
    </div>
}

function DetailItem({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
    return <div className="min-w-0"><div className="mb-1 text-xs text-muted-foreground">{label}</div><div className={mono ? "truncate font-mono font-medium" : "break-words font-medium"}>{value}</div></div>
}

export function warehouseVoucherTitle(voucher: InventoryVoucherPrintDetail) {
    return String(voucher.type?.direction || "").toUpperCase() === "I"
        ? "PHIẾU NHẬP KHO"
        : "PHIẾU XUẤT KHO"
}

/** Shared, quantity-only print contract for every warehouse voucher. */
export function WarehouseVoucherPrintDocument({ voucher, sourceDocument }: { voucher: InventoryVoucherPrintDetail; sourceDocument?: Export | Return }) {
    if (voucher.source_type === "SALES_EXPORT" && sourceDocument) {
        const exportDocument = sourceDocument as Export
        return <div className="bg-white p-7 text-black"><ExportInfo data={exportDocument} /><ExportItems data={exportDocument} items={exportDocument.items ?? []} /></div>
    }
    if (voucher.source_type === "SALES_RETURN" && sourceDocument) {
        return <SalesReturnPrintDocument data={sourceDocument as Return} />
    }
    const items = voucher.items ?? []
    const totalQuantity = items.reduce((total, item) => total + Number(item.quantity || 0), 0)
    const warehouse = voucher.physical_warehouse?.name || voucher.warehouse?.name || "-"

    return (
        <div className="bg-white p-7 text-[13px] text-black">
            <div className="mb-5 text-center">
                <h1 className="text-xl font-bold">{warehouseVoucherTitle(voucher)}</h1>
                <div className="mt-1">Số chứng từ kho: <strong>{voucher.voucher_no || "-"}</strong></div>
                {voucher.source_document_no ? (
                    <div>Chứng từ nguồn: <strong>{voucher.source_document_no}</strong></div>
                ) : null}
                <div>Ngày chứng từ: {formatDate(voucher.document_date || voucher.posting_date)}</div>
            </div>

            <WarehouseVoucherPrintHeader voucher={voucher} warehouse={warehouse} />

            <table className="w-full border-collapse border border-black text-xs">
                <thead>
                    <tr className="text-center">
                        {['STT', 'Mã hàng', 'Tên hàng hóa', 'ĐVT', 'Số lượng', 'Kho', 'Lô', 'Ghi chú'].map((title) => (
                            <th key={title} className="border border-black px-2 py-2">{title}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={`${item.id}-${index}`}>
                            <td className="border border-black px-2 py-1.5 text-center">{index + 1}</td>
                            <td className="border border-black px-2 py-1.5 font-mono">{item.product?.code || "-"}</td>
                            <td className="border border-black px-2 py-1.5">{item.product?.name || "-"}</td>
                            <td className="border border-black px-2 py-1.5 text-center">{item.unit || item.product?.unit || "-"}</td>
                            <td className="border border-black px-2 py-1.5 text-right">{formatNumber(Number(item.quantity || 0))}</td>
                            <td className="border border-black px-2 py-1.5">{item.warehouse?.name || item.warehouse?.code || "-"}</td>
                            <td className="border border-black px-2 py-1.5">{item.lot_code || "-"}</td>
                            <td className="border border-black px-2 py-1.5">{item.note || ""}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr>
                        <td colSpan={4} className="border border-black px-2 py-2 text-right font-semibold">Cộng</td>
                        <td className="border border-black px-2 py-2 text-right font-semibold">{formatNumber(totalQuantity)}</td>
                        <td colSpan={3} className="border border-black px-2 py-2" />
                    </tr>
                </tfoot>
            </table>
            <div className="mt-12 grid grid-cols-3 text-center">
                {['Người lập phiếu', 'Thủ kho', 'Người giao/nhận'].map((role) => <div key={role}><div className="font-semibold">{role}</div><div className="italic">(Ký, họ tên)</div></div>)}
            </div>
        </div>
    )
}

/** Common inbound template, used by the warehouse-voucher print entry point. */
function SalesReturnPrintDocument({ data }: { data: Return }) {
    const items = data.items ?? []
    const totalQuantity = items.reduce((total: number, item: any) => total + Number(item.quantity || 0), 0)
    const customer = (data as any).customer || (data as any).order?.customer
    return <div className="bg-white p-7 text-[13px] text-black">
        <div className="mb-2 text-center"><div className="text-sm font-bold uppercase tracking-wide">CÔNG TY CỔ PHẦN QUỐC TẾ CUỘC SỐNG VIỆT</div><div className="text-xs text-muted-foreground">Số 54C1, KP 11, Phường Tân Triều, Tỉnh Đồng Nai, Việt Nam</div></div>
        <div className="flex items-center justify-between bg-gray-50/60 px-3 py-1.5"><div className="flex items-center gap-3"><span className="text-[12px] font-semibold text-muted-foreground">Số phiếu NK</span><span className="border border-blue-300 bg-blue-50 px-3 py-0.5 text-sm font-bold">{data.return_no || "-"}</span></div><div className="text-[12px] text-muted-foreground">{(data as any).export?.export_no ? `Theo phiếu xuất ${(data as any).export.export_no}` : "Nhập trả hàng"}</div></div>
        <div className="py-3 text-center"><div className="text-[22px] font-extrabold uppercase tracking-wide">PHIẾU NHẬP KHO</div><div className="mt-0.5 text-[12px] italic text-muted-foreground">{formatDate((data as any).return_date || (data as any).created_at)}</div></div>
        <div className="space-y-1 px-3 py-2"><div>- Họ và tên người giao hàng: <strong>{customer?.name || ""}</strong></div><div>- Địa chỉ (bộ phận): {customer?.address || ""}</div><div>- Lý do nhập kho: {(data as any).reason || "Nhập kho hàng trả lại"}</div></div>
        <table className="w-full border-collapse border border-gray-400 text-xs"><thead><tr className="bg-gray-100 text-center font-semibold"><th className="border border-gray-400 px-2 py-1.5">STT</th><th className="border border-gray-400 px-2 py-1.5">Mã hàng</th><th className="border border-gray-400 px-2 py-1.5">Tên sản phẩm, hàng hóa</th><th className="border border-gray-400 px-2 py-1.5">ĐVT</th><th className="border border-gray-400 px-2 py-1.5">Số lượng</th><th className="border border-gray-400 px-2 py-1.5">Hình thức nhập</th><th className="border border-gray-400 px-2 py-1.5">Nhập tại kho</th></tr></thead><tbody>{items.map((item: any, index: number) => <tr key={item.id || index}><td className="border border-gray-400 px-2 py-1.5 text-center">{index + 1}</td><td className="border border-gray-400 px-2 py-1.5 font-mono">{item.product?.code || ""}</td><td className="border border-gray-400 px-2 py-1.5">{item.product?.name || ""}</td><td className="border border-gray-400 px-2 py-1.5 text-center">{item.product?.unit || ""}</td><td className="border border-gray-400 px-2 py-1.5 text-right">{formatNumber(Number(item.quantity || 0))}</td><td className="border border-gray-400 px-2 py-1.5 text-center">Trả hàng</td><td className="border border-gray-400 px-2 py-1.5">{item.warehouse?.code ? `${item.warehouse.code} - ${item.warehouse.name}` : item.warehouse?.name || ""}</td></tr>)}</tbody><tfoot><tr className="bg-gray-100 font-semibold"><td colSpan={4} className="border border-gray-400 px-2 py-1.5 text-right">Cộng</td><td className="border border-gray-400 px-2 py-1.5 text-right">{formatNumber(totalQuantity)}</td><td colSpan={2} className="border border-gray-400" /></tr></tfoot></table>
        <PrintSignatures />
    </div>
}

function PrintSignatures() { return <div className="px-4 pb-5 pt-3"><div className="mb-7 mr-10 text-right text-[11px] italic text-muted-foreground">Ngày ...... tháng ...... năm .........</div><div className="grid grid-cols-5 gap-2 text-center text-[12px]">{["Người lập biểu", "Người giao hàng", "Thủ kho", "Kế toán trưởng", "Quản lý nhà máy"].map((role) => <div key={role}><div className="min-h-[18px] font-semibold">{role}</div><div className="text-[11px] italic text-muted-foreground">(Ký, họ tên)</div><div className="mt-12">&nbsp;</div></div>)}</div></div> }

function WarehouseVoucherPrintHeader({ voucher, warehouse }: { voucher: InventoryVoucherPrintDetail; warehouse: string }) {
    if (voucher.source_type === "SALES_EXPORT") {
        return <div className="mb-4 space-y-1"><div><span className="text-gray-600">Lý do xuất kho:</span> Xuất bán hàng</div><div><span className="text-gray-600">Kho xuất:</span> {warehouse}</div><div><span className="text-gray-600">Tham chiếu phiếu xuất bán:</span> {voucher.source_document_no || "-"}</div></div>
    }
    if (voucher.source_type === "SALES_RETURN") {
        return <div className="mb-4 space-y-1"><div><span className="text-gray-600">Lý do nhập kho:</span> Nhập hàng bán trả lại</div><div><span className="text-gray-600">Kho nhập:</span> {warehouse}</div><div><span className="text-gray-600">Tham chiếu phiếu trả hàng:</span> {voucher.source_document_no || "-"}</div></div>
    }
    return <div className="mb-4 space-y-1"><div><span className="text-gray-600">Loại nghiệp vụ:</span> {voucher.type?.name || voucher.voucher_type_code}</div><div><span className="text-gray-600">Kho:</span> {warehouse}</div><div><span className="text-gray-600">Diễn giải:</span> {voucher.description || "-"}</div></div>
}

function formatDate(value?: string | number[]) {
    if (!value) return "-"
    if (Array.isArray(value)) return `${String(value[2]).padStart(2, "0")}/${String(value[1]).padStart(2, "0")}/${value[0]}`
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
    return match ? `${match[3]}/${match[2]}/${match[1]}` : value
}
