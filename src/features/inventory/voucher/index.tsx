import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useQuery } from "@tanstack/react-query"
import { ExternalLink, Funnel, Printer } from "lucide-react"
import { getMyPermissions } from "@/api/auth/permission"
import { getVoucherPrintDetail, listVoucherTypes, listVouchers, type InventoryVoucher } from "@/api/inventory/voucher"
import { getExport } from "@/api/sale/export"
import { getReturn } from "@/api/sale/return"
import { SearchOnBlurInput } from "@/components/search-on-blur-input"
import { WarehouseTreeFilter } from "@/features/inventory/components/warehouse-tree-filter"
import { StickyReportTable } from "@/features/inventory/components/sticky-report-table"
import { PageSection } from "@/components/page-section"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { Route } from "@/routes/_authenticated/inventory/vouchers"
import { hasViewPermissionForPath } from "@/lib/navigation-permissions"
import { cn } from "@/lib/utils"
import { WarehouseVoucherDetail, WarehouseVoucherPrintDocument, WAREHOUSE_VOUCHER_PRINT_CSS } from "./warehouse-voucher-print"

export default function InventoryVoucherPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()
    const { pagination, setPagination } = useUrlPagination(search, navigate)
    const [selectedVoucher, setSelectedVoucher] = useState<{ id: number; printOnOpen: boolean } | null>(null)
    const { data: types = [] } = useQuery({ queryKey: ["inventory-voucher-types"], queryFn: () => listVoucherTypes() })
    const { data: permissions = [] } = useQuery({ queryKey: ["my-permissions"], queryFn: getMyPermissions })
    const canViewSalesExports = hasViewPermissionForPath("/sales/exports", permissions)
    const canViewSalesReturns = hasViewPermissionForPath("/sales/returns", permissions)
    const canViewLedger = hasViewPermissionForPath("/inventory/ledgers", permissions)
    const { data, isLoading, error } = usePaginatedList(
        ["inventory-vouchers", search.page, search.size, search.keyword, search.type, search.warehouse_ids, search.from, search.to],
        listVouchers,
        { page: search.page, size: search.size, keyword: search.keyword, type: search.type, warehouse_ids: search.warehouse_ids, from: search.from, to: search.to },
    )
    const setFilter = (next: Record<string, unknown>) => navigate({ search: (current: any) => ({ ...current, ...next, page: 1 }) })
    const toggleQuickType = (type: "SALES_EXPORT" | "SALES_RETURN") => setFilter({ type: search.type === type ? undefined : type })

    return <PageSection title="Chứng từ kho" description="Theo dõi số lượng nhập xuất; không bao gồm giá trị." data={data} isLoading={isLoading} error={error}>
        {(result) => <div className="space-y-4">
            <Card className="gap-0 overflow-hidden border-border/60 py-0 shadow-sm"><CardHeader className="border-b bg-muted/40 px-4 py-3"><div className="flex flex-wrap items-center gap-2">
                <SearchOnBlurInput value={search.keyword} onChange={(keyword) => setFilter({ keyword })} placeholder="Tìm chứng từ nguồn, chứng từ kho hoặc diễn giải..." wrapperClassName="relative h-10 min-w-[220px] flex-[1_1_260px] xl:max-w-[360px]" className="h-10 min-h-10 rounded-md border-slate-300 bg-white pl-10 shadow-xs" />
                <WarehouseTreeFilter value={search.warehouse_ids || []} onChange={(warehouseIds) => setFilter({ warehouse_id: undefined, warehouse_ids: warehouseIds.length ? warehouseIds.join(",") : undefined })} className="min-w-[240px] flex-[1_1_280px] xl:max-w-[360px]" />
                <VoucherTypeFilter value={search.type} types={types} onApply={(type) => setFilter({ type })} />
                <Input type="date" aria-label="Từ ngày" className="h-10 min-w-[160px] flex-1 rounded-md border-slate-300 bg-white shadow-xs" value={search.from || ""} onChange={(event) => setFilter({ from: event.target.value || undefined })} />
                <Input type="date" aria-label="Đến ngày" className="h-10 min-w-[160px] flex-1 rounded-md border-slate-300 bg-white shadow-xs" value={search.to || ""} onChange={(event) => setFilter({ to: event.target.value || undefined })} />
                <div className="flex h-10 items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-xs"><span className="px-2 text-xs font-medium text-muted-foreground">Lọc nhanh</span><Button size="sm" variant={search.type === "SALES_EXPORT" ? "default" : "ghost"} onClick={() => toggleQuickType("SALES_EXPORT")}>Xuất bán hàng</Button><Button size="sm" variant={search.type === "SALES_RETURN" ? "default" : "ghost"} onClick={() => toggleQuickType("SALES_RETURN")}>Nhập trả hàng</Button></div>
            </div></CardHeader><CardContent className="p-0"><StickyReportTable columnWidths={[76, 125, 105, 360, 230, 210]} defaultPinnedUntil={2} renderHeader={() => <tr><th className="border-r px-3 py-2 text-left font-semibold last:border-r-0">In phiếu</th><th className="border-r px-3 py-2 text-left font-semibold last:border-r-0">Ngày chứng từ</th><th className="border-r px-3 py-2 text-left font-semibold last:border-r-0">Giờ chứng từ</th><th className="border-r px-3 py-2 text-left font-semibold last:border-r-0">Loại nghiệp vụ</th><th className="border-r px-3 py-2 text-left font-semibold last:border-r-0">Chứng từ nguồn</th><th className="border-r px-3 py-2 text-left font-semibold last:border-r-0">Chứng từ kho</th></tr>} renderBody={() => result.items.map((voucher: InventoryVoucher) => <VoucherRow key={voucher.id} voucher={voucher} typeName={types.find((type) => type.code === voucher.voucher_type_code)?.name} canViewSalesExports={canViewSalesExports} canViewSalesReturns={canViewSalesReturns} canViewLedger={canViewLedger} onOpen={() => setSelectedVoucher({ id: voucher.id, printOnOpen: false })} onPrint={() => setSelectedVoucher({ id: voucher.id, printOnOpen: true })} />)} /></CardContent></Card>
            <div className="flex justify-end gap-2"><Button variant="outline" disabled={search.page <= 1} onClick={() => setPagination({ pageIndex: search.page - 2, pageSize: search.size })}>Trước</Button><span className="py-2 text-sm text-muted-foreground">Trang {result.current_page}/{result.total_page} · {result.total} chứng từ</span><Button variant="outline" disabled={search.page >= result.total_page} onClick={() => setPagination({ pageIndex: search.page, pageSize: search.size })}>Sau</Button></div>
            <WarehouseVoucherDialog id={selectedVoucher?.id ?? null} printOnOpen={selectedVoucher?.printOnOpen ?? false} canViewLedger={canViewLedger} onClose={() => setSelectedVoucher(null)} />
        </div>}
    </PageSection>
}

function VoucherRow({ voucher, typeName, canViewSalesExports, canViewSalesReturns, onOpen, onPrint }: { voucher: InventoryVoucher; typeName?: string; canViewSalesExports: boolean; canViewSalesReturns: boolean; canViewLedger: boolean; onOpen: () => void; onPrint: () => void }) {
    const sourceHref = voucher.source_document_no && voucher.source_type === "SALES_EXPORT" && canViewSalesExports
        ? `/sales/exports?keyword=${encodeURIComponent(voucher.source_document_no)}`
        : voucher.source_document_no && voucher.source_type === "SALES_RETURN" && canViewSalesReturns
            ? `/sales/returns?keyword=${encodeURIComponent(voucher.source_document_no)}&from_date=2000-01-01&to_date=${todayYmd()}`
            : null
    const operationName = typeName || voucher.voucher_type_code
    const documentDate = formatDocumentDate(voucher.document_date || voucher.posting_date)
    const documentTime = voucher.document_time || voucher.posting_time || "-"
    return <tr className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50/70"><td className="border-r px-3 py-2 align-middle last:border-r-0"><Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" aria-label="In phiếu" onClick={onPrint}><Printer className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>In phiếu</TooltipContent></Tooltip></td><td className="border-r px-3 py-2 align-middle last:border-r-0"><div className="truncate" title={documentDate}>{documentDate}</div></td><td className="border-r px-3 py-2 align-middle last:border-r-0"><div className="truncate" title={documentTime}>{documentTime}</div></td><td className="border-r px-3 py-2 align-middle last:border-r-0"><div className="truncate" title={operationName}>{operationName}</div></td><td className="border-r px-3 py-2 align-middle last:border-r-0"><div className="truncate">{sourceHref ? <a href={sourceHref} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 font-mono text-primary hover:underline"><span className="truncate">{voucher.source_document_no}</span><ExternalLink className="h-3 w-3 shrink-0" /></a> : voucher.source_document_no || "-"}</div></td><td className="border-r px-3 py-2 align-middle last:border-r-0"><button className="block max-w-full truncate font-mono font-medium text-primary hover:underline" onClick={onOpen}>{voucher.voucher_no || "-"}</button></td></tr>
}

function WarehouseVoucherDialog({ id, printOnOpen, canViewLedger, onClose }: { id: number | null; printOnOpen: boolean; canViewLedger: boolean; onClose: () => void }) {
    const { data: voucher, isLoading } = useQuery({ queryKey: ["inventory-voucher-print", id], queryFn: () => getVoucherPrintDetail(id!), enabled: !!id })
    const sourceQuery = useQuery<any>({
        queryKey: ["inventory-voucher-print-source", voucher?.source_type, voucher?.source_id],
        queryFn: () => voucher?.source_type === "SALES_EXPORT" ? getExport(voucher.source_id!) : getReturn(voucher!.source_id!),
        enabled: !!voucher?.source_id && (voucher.source_type === "SALES_EXPORT" || voucher.source_type === "SALES_RETURN"),
    })
    const sourceDocument = sourceQuery.data?.data ?? sourceQuery.data
    const printedRef = useRef(false)
    useEffect(() => { printedRef.current = false }, [id, printOnOpen])
    useEffect(() => {
        if (!printOnOpen || !voucher || sourceQuery.isLoading || printedRef.current) return
        printedRef.current = true
        const timer = window.setTimeout(() => window.print(), 100)
        return () => window.clearTimeout(timer)
    }, [printOnOpen, sourceQuery.isLoading, voucher])
    const ledgerHref = voucher?.voucher_no && canViewLedger ? `/inventory/ledgers?doc_text=${encodeURIComponent(voucher.voucher_no)}` : null
    return <><Dialog open={!!id} onOpenChange={(open) => !open && onClose()}><style>{WAREHOUSE_VOUCHER_PRINT_CSS}</style><DialogContent className="flex max-h-[92vh] w-[min(96vw,1400px)] !max-w-none flex-col overflow-hidden print:hidden"><DialogHeader><DialogTitle>Chứng từ kho {voucher?.voucher_no || ""}</DialogTitle></DialogHeader>{isLoading || sourceQuery.isLoading ? <div>Đang tải...</div> : voucher ? <><div className="flex shrink-0 justify-end gap-2">{ledgerHref ? <Button variant="outline" size="sm" asChild><a href={ledgerHref} target="_blank" rel="noreferrer"><ExternalLink className="mr-1.5 h-3.5 w-3.5" />Xem chi tiết ở sổ kho</a></Button> : null}<Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" aria-label="In phiếu" onClick={() => window.print()}><Printer className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>In phiếu</TooltipContent></Tooltip></div><div className="min-h-0 overflow-auto"><WarehouseVoucherDetail voucher={voucher} /></div></> : null}</DialogContent></Dialog>{voucher ? createPortal(<div id="warehouse-voucher-print" className="hidden"><WarehouseVoucherPrintDocument voucher={voucher} sourceDocument={sourceDocument} /></div>, document.body) : null}</>
}

function formatDocumentDate(value?: string) {
    if (!value) return "-"
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
    return match ? `${match[3]}/${match[2]}/${match[1]}` : value
}

function todayYmd() {
    const date = new Date()
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function VoucherTypeFilter({ value, types, onApply }: { value?: string; types: Array<{ code: string; name: string; direction: string }>; onApply: (value?: string) => void }) {
    const [open, setOpen] = useState(false)
    const [selected, setSelected] = useState<string[]>(() => value ? value.split(",").filter(Boolean) : [])
    const inbound = types.filter((type) => String(type.direction).toUpperCase() === "I")
    const outbound = types.filter((type) => String(type.direction).toUpperCase() !== "I")
    const active = selected.length > 0
    useEffect(() => { if (!open) setSelected(value ? value.split(",").filter(Boolean) : []) }, [open, value])
    const toggle = (code: string) => setSelected((current) => current.includes(code) ? current.filter((item) => item !== code) : [...current, code])
    const toggleGroup = (group: typeof types) => {
        const codes = group.map((type) => type.code)
        const allSelected = codes.every((code) => selected.includes(code))
        setSelected((current) => allSelected ? current.filter((code) => !codes.includes(code)) : Array.from(new Set([...current, ...codes])))
    }
    const renderGroup = (label: string, group: typeof types, selectAllLabel: string) => {
        if (!group.length) return null
        const codes = group.map((type) => type.code)
        const selectedCount = codes.filter((code) => selected.includes(code)).length
        const checked = selectedCount === 0 ? false : selectedCount === codes.length ? true : "indeterminate"
        return <div className="space-y-1"><div className="px-2 text-xs font-semibold text-muted-foreground">{label}</div><label className="flex cursor-pointer items-center gap-2 rounded-md bg-muted/40 px-2 py-1.5 text-sm font-medium hover:bg-muted/70"><Checkbox checked={checked} onCheckedChange={() => toggleGroup(group)} /><span>{selectAllLabel}</span></label>{group.map((type) => <label key={type.code} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60"><Checkbox checked={selected.includes(type.code)} onCheckedChange={() => toggle(type.code)} /><span>{type.name}</span></label>)}</div>
    }
    
    return <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button type="button" variant="outline" className={cn("h-10 min-w-[190px] flex-[0.9_1_230px] justify-between border-slate-300 bg-white px-3 shadow-xs xl:max-w-[280px]", active && "border-primary/40 bg-primary/5 text-primary")}><span className="truncate">{active ? `Loại chứng từ (${selected.length})` : "Loại chứng từ"}</span><Funnel className="h-4 w-4 shrink-0 text-muted-foreground" /></Button></PopoverTrigger><PopoverContent align="start" className="w-[680px] max-w-[calc(100vw-2rem)] p-3"><div className="mb-3 flex items-center justify-between"><div className="font-semibold">Lọc loại chứng từ</div>{active ? <Button type="button" variant="ghost" size="sm" onClick={() => { setSelected([]); onApply(undefined); setOpen(false) }}>Xóa chọn</Button> : null}</div><div className="grid gap-4 md:grid-cols-2">{renderGroup("Chứng từ nhập", inbound, "Chọn tất cả chứng từ nhập")}{renderGroup("Chứng từ xuất", outbound, "Chọn tất cả chứng từ xuất")}</div><div className="mt-4 flex justify-end gap-2 border-t pt-3"><Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Hủy</Button><Button type="button" size="sm" onClick={() => { onApply(selected.length ? selected.join(",") : undefined); setOpen(false) }}>Áp dụng</Button></div></PopoverContent></Popover>
}
