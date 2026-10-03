import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { Download, Loader2, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { listCargoDetails, CARGO_DATE_FIELDS, CARGO_DATE_RANGE_KEYS, type CargoRow, type CargoOptionKind, type CargoDateField } from "@/api/purchasing/cargo-details"
import { Route } from "@/routes/_authenticated/purchasing/cargo-details"
import { PageSection } from "@/components/page-section"
import { CrudTable } from "@/components/crud/crud-table"
import { SearchOnBlurInput } from "@/components/search-on-blur-input"
import { Button } from "@/components/ui/button"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { useIsMobile } from "@/hooks/use-mobile"
import { formatNumber } from "@/lib/utils"
import { PRODUCT_NATURE_OPTIONS } from "@/features/product/components/product-nature"
import { WarehouseTreeFilter } from "@/features/inventory/components/warehouse-tree-filter"
import { CARGO_CENTERED_COLUMNS, CARGO_COLUMNS, CARGO_STATUS_OPTIONS, CARGO_REPORT_TITLE } from "./columns"
import { CargoPreferencesControl, useCargoPreferences } from "./preferences"
import { DateColumnFilter, FilterChip, FilterTrigger, MultiColumnFilter } from "./filters"
import { exportCargoDetails } from "./export"

const multiKeys = ["product_ids", "supplier_ids", "port_ids", "warehouse_ids", "natures", "status"] as const
const labels = { product_ids: "Sản phẩm", supplier_ids: "Nhà cung cấp", port_ids: "Cảng", warehouse_ids: "Kho", natures: "Loại hàng", status: "Tình trạng" }
const columnFilters = { product_code: "product_ids", product_name: "product_ids", supplier_name: "supplier_ids", port_name: "port_ids", nature: "natures", status: "status" } as const
const singleKeys = [...CARGO_DATE_RANGE_KEYS, "sort_field", "sort_direction"] as const
const formatFilterDate = (value: string) => value ? value.split("-").reverse().join("/") : "…"

export default function CargoDetailsPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()
    const isMobile = useIsMobile()
    const { pagination, setPagination } = useUrlPagination(search, navigate)
    const { keyword, setKeyword, multiFilters, setMulti, singleFilters, setSingleFilters, requestFilters } = useUrlListFilters(
        search, navigate, multiKeys, singleKeys,
    )
    const filters = { keyword, ...requestFilters }
    const query = useQuery({
        queryKey: ["cargo-details", search.page, search.size, filters],
        queryFn: () => listCargoDetails({ ...filters, page: search.page, size: search.size }),
        placeholderData: previous => previous,
    })
    const { columns: visibleColumns, preference } = useCargoPreferences()
    const [exporting, setExporting] = useState(false)
    const staticOptions = { natures: PRODUCT_NATURE_OPTIONS, status: CARGO_STATUS_OPTIONS }
    const columns: ColumnDef<CargoRow, unknown>[] = visibleColumns.map(column => {
        const filterKey = columnFilters[column.key as keyof typeof columnFilters]
        const dateField = CARGO_DATE_FIELDS.find(field => field === column.key)
        const sortDirection = singleFilters.sort_field === dateField && (singleFilters.sort_direction === "asc" || singleFilters.sort_direction === "desc") ? singleFilters.sort_direction : undefined
        return {
            id: column.key,
            accessorFn: row => column.key === "stt" ? undefined : row[column.key],
            header: () => <div className="flex items-center justify-center gap-1">
                <span>{column.label}</span>
                {filterKey && <MultiColumnFilter label={labels[filterKey]} value={multiFilters[filterKey]} onChange={values => setMulti(filterKey, values)}
                    kind={filterKey === "natures" || filterKey === "status" ? undefined : filterKey}
                    options={filterKey === "natures" || filterKey === "status" ? staticOptions[filterKey] : undefined} />}
                {column.key === "warehouse_name" && <WarehouseTreeFilter value={multiFilters.warehouse_ids.map(Number)} onChange={values => setMulti("warehouse_ids", values.map(String))}
                    trigger={<FilterTrigger label="Kho" active={multiFilters.warehouse_ids.length > 0} />} />}
                {dateField && <DateColumnFilter label={column.label} from={singleFilters[`${dateField}_from`]} to={singleFilters[`${dateField}_to`]} sortDirection={sortDirection}
                    onChange={(from, to, direction) => {
                        setSingleFilters({
                            [`${dateField}_from`]: from, [`${dateField}_to`]: to,
                            ...(direction ? { sort_field: dateField, sort_direction: direction }
                                : singleFilters.sort_field === dateField ? { sort_field: undefined, sort_direction: undefined } : {}),
                        })
                    }} />}
            </div>,
            size: column.width,
            meta: { tdClassName: CARGO_CENTERED_COLUMNS.has(column.key) ? "text-center" : undefined },
            cell: ({ row, table }) => {
                const page = table.getState().pagination
                const value = column.key === "stt" ? page.pageIndex * page.pageSize + row.index + 1
                    : column.value ? column.value(row.original) : row.original[column.key]
                return <div className={`whitespace-normal break-words ${CARGO_CENTERED_COLUMNS.has(column.key) ? "text-center" : column.type === "number" ? "text-right" : "text-left"} ${column.type === "number" ? "tabular-nums" : ""}`}>
                    {column.type === "number" ? formatNumber(Number(value ?? 0)) : value || "—"}
                </div>
            },
        }
    })
    const handleExport = async () => {
        setExporting(true)
        try {
            const count = await exportCargoDetails(filters, visibleColumns, preference.pinnedColumnKey)
            if (count) toast.success(`Đã xuất ${formatNumber(count)} dòng`)
            else toast.info("Không có dữ liệu để xuất")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Xuất Excel thất bại")
        } finally { setExporting(false) }
    }
    const activeDates = CARGO_DATE_FIELDS.filter(field => singleFilters[`${field}_from`] || singleFilters[`${field}_to`])
    const dateLabel = (field: CargoDateField | string) => CARGO_COLUMNS.find(column => column.key === field)?.label ?? "Ngày"
    const hasSort = Boolean(singleFilters.sort_field && singleFilters.sort_direction)
    const hasFilters = Boolean(keyword || activeDates.length || hasSort || multiKeys.some(key => multiFilters[key].length))
    return <PageSection title={CARGO_REPORT_TITLE} isLoading={query.isLoading} error={query.error} data={query.data}
        actions={<div className="flex gap-2"><Button disabled={exporting} onClick={handleExport}>
            {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}{exporting ? "Đang xuất..." : "Xuất Excel"}
        </Button><CargoPreferencesControl /></div>}>
        {data => <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-3"><SearchOnBlurInput value={keyword} onChange={setKeyword} placeholder="Tìm số lô, mã hàng, tên hàng..." wrapperClassName="relative w-full sm:w-80" className="pl-10" />
                <span className="ml-auto text-sm text-muted-foreground">{formatNumber(data.total)} dòng</span></div>
            {hasFilters && <div className="flex flex-wrap items-center gap-2">
                {keyword && <FilterChip label="Tìm kiếm" values={[keyword]} onClear={() => setKeyword("")} />}
                {multiKeys.filter(key => multiFilters[key].length).map(key => <FilterChip key={key} label={labels[key]} values={multiFilters[key]}
                    kind={key === "natures" || key === "status" ? undefined : key as CargoOptionKind}
                    options={key === "natures" || key === "status" ? staticOptions[key] : undefined} onClear={() => setMulti(key, [])} />)}
                {activeDates.map(field => <FilterChip key={field} label={dateLabel(field)} values={[`${formatFilterDate(singleFilters[`${field}_from`])} – ${formatFilterDate(singleFilters[`${field}_to`])}`]}
                    onClear={() => setSingleFilters({ [`${field}_from`]: undefined, [`${field}_to`]: undefined })} />)}
                {hasSort && <FilterChip label="Sắp xếp" values={[`${dateLabel(singleFilters.sort_field)} ${singleFilters.sort_direction === "asc" ? "tăng dần" : "giảm dần"}`]}
                    onClear={() => setSingleFilters({ sort_field: undefined, sort_direction: undefined })} />}
                <Button variant="ghost" size="sm" onClick={() => navigate({ search: {
                    page: 1, size: search.size, keyword: "",
                    product_ids: undefined, supplier_ids: undefined, port_ids: undefined, warehouse_ids: undefined,
                    natures: undefined, status: undefined,
                    ...Object.fromEntries(singleKeys.map(key => [key, undefined])) as Record<typeof singleKeys[number], undefined>,
                }, replace: true })}><RotateCcw className="mr-2 h-4 w-4" />Xóa bộ lọc</Button>
            </div>}
            <CrudTable data={data.items} columns={columns} entityName="hàng hóa" pagination={pagination} onPaginationChange={setPagination} pageCount={data.total_page}
                showToolbar={false} showCellBorders enableColumnResize enableColumnPinning={!isMobile} defaultPinnedColumnId={preference.pinnedColumnKey ?? undefined}
                defaultPinnedUntil={-1} enableStickyHorizontalScroll headerVariant="report" />
        </div>}
    </PageSection>
}
