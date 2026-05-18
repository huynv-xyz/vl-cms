import { CrudTable } from "@/components/crud/crud-table"
import { DatePicker } from "@/components/date-picker"
import { AsyncMultiSelect } from "@/components/rjsf/async-multi-select"
import { SearchOnBlurInput } from "@/components/search-on-blur-input"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getProduct, listProducts } from "@/api/product"
import { getNation, listNations } from "@/api/purchasing/nation"
import { getSupplier, listSuppliers } from "@/api/purchasing/supplier"
import { nationOption, productOption, supplierOption } from "@/lib/option-mapper"
import { formatCurrency, formatNumber } from "@/lib/utils"
import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import { ClipboardList } from "lucide-react"
import type { Contract } from "../data/schema"
import { contractColumns } from "./contract-columns"

type ContractFilters = {
    status?: string[]
    product_ids?: string[]
    supplier_ids?: string[]
    nation_ids?: string[]
    signed_date_from?: string
    signed_date_to?: string
}

type ContractTableProps = {
    data: Contract[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
    filters: ContractFilters
    onFiltersChange: (filters: ContractFilters) => void
}

type FilterIdList = string[]

const STATUS_OPTIONS = [
    { value: "DRAFT", label: "Nháp" },
    { value: "SIGNED", label: "Đã ký" },
    { value: "DONE", label: "Hoàn tất" },
    { value: "CANCELLED", label: "Đã hủy" },
]

export function ContractTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
}: ContractTableProps) {
    const totalAmount = data.reduce((sum, c) => sum + getTotalAmount(c), 0)
    const totalAmountVnd = data.reduce((sum, c) => sum + getTotalAmountVnd(c), 0)
    const totalQuantity = data.reduce((sum, c) => sum + (c.total_quantity ?? 0), 0)
    const supplierCount = new Set(data.map((c) => c.supplier_id).filter(Boolean)).size
    const setFilter = <K extends keyof ContractFilters>(key: K, value: ContractFilters[K]) =>
        onFiltersChange({ ...filters, [key]: value })

    return (
        <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
                <SummaryCard label="Hợp đồng đang xem" value={formatNumber(data.length)} />
                <SummaryCard label="Nhà cung cấp" value={formatNumber(supplierCount)} />
                <SummaryCard label="Tổng SL hợp đồng" value={formatNumber(totalQuantity)} />
            </div>

            <div className="space-y-2">
                <div className="flex w-full flex-wrap items-center gap-2">
                    <SearchOnBlurInput
                        value={keyword}
                        onChange={onKeywordChange}
                        placeholder="Tìm theo mã hợp đồng, nhà cung cấp..."
                        wrapperClassName="relative h-10 min-w-[280px] flex-[1.2_1_0]"
                        className="h-10 rounded-md border-slate-300 bg-white pl-10 shadow-xs"
                    />

                    <AsyncMultiSelect
                        className="h-10 min-w-[280px] flex-[1.8_1_0] border-slate-300 bg-white shadow-xs"
                        value={filters.product_ids}
                        onChange={(v: FilterIdList) => setFilter("product_ids", v)}
                        placeholder="Sản phẩm"
                        dataSource={{
                            getList: listProducts,
                            getById: getProduct,
                            params: { page: 1, size: 20 },
                        }}
                        mapOption={productOption}
                    />
                </div>

                <div className="flex w-full flex-wrap items-center gap-2">
                    <AsyncMultiSelect
                        className="h-10 min-w-[190px] flex-1 border-slate-300 bg-white shadow-xs"
                        value={filters.supplier_ids}
                        onChange={(v: FilterIdList) => setFilter("supplier_ids", v)}
                        placeholder="Nhà cung cấp"
                        dataSource={{
                            getList: listSuppliers,
                            getById: getSupplier,
                            params: { page: 1, size: 20 },
                        }}
                        mapOption={supplierOption}
                    />

                    <AsyncMultiSelect
                        className="h-10 min-w-[170px] flex-1 border-slate-300 bg-white shadow-xs"
                        value={filters.nation_ids}
                        onChange={(v: FilterIdList) => setFilter("nation_ids", v)}
                        placeholder="Quốc gia"
                        dataSource={{
                            getList: listNations,
                            getById: getNation,
                            params: { page: 1, size: 20 },
                        }}
                        mapOption={nationOption}
                    />

                    <StatusFilter
                        value={filters.status}
                        onChange={(v) => setFilter("status", v)}
                    />

                    <DatePicker
                        className="min-w-[145px] flex-1 [&_button]:h-10"
                        value={filters.signed_date_from}
                        onChange={(v) => setFilter("signed_date_from", v)}
                        placeholder="Từ ngày ký"
                    />

                    <DatePicker
                        className="min-w-[145px] flex-1 [&_button]:h-10"
                        value={filters.signed_date_to}
                        onChange={(v) => setFilter("signed_date_to", v)}
                        placeholder="Đến ngày ký"
                    />
                </div>
            </div>

            <CrudTable<Contract>
                data={data}
                columns={contractColumns}
                entityName="hợp đồng"
                pagination={pagination}
                onPaginationChange={onPaginationChange}
                pageCount={pageCount}
                showToolbar={false}
                footer={
                    <div className="flex w-full flex-wrap justify-end gap-4">
                        <div>
                            <span className="mr-2 text-muted-foreground">Tổng tiền:</span>
                            <span className="font-bold">{formatCurrency(totalAmount)}</span>
                        </div>
                        <div>
                            <span className="mr-2 text-muted-foreground">Tổng VNĐ:</span>
                            <span className="font-bold">{formatCurrency(totalAmountVnd)}</span>
                        </div>
                    </div>
                }
            />
        </div>
    )
}

function StatusFilter({
    value,
    onChange,
}: {
    value?: string[]
    onChange: (value?: string[]) => void
}) {
    const selected = value ?? []

    const toggleStatus = (status: string) => {
        const next = selected.includes(status)
            ? selected.filter((item) => item !== status)
            : [...selected, status]

        onChange(next.length ? next : undefined)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className="h-10 min-w-[145px] flex-1 justify-between rounded-md border-slate-300 bg-white px-3 shadow-xs"
                >
                    <span className="inline-flex min-w-0 items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-slate-500" />
                        <span className="truncate">
                            {selected.length ? `Trạng thái (${selected.length})` : "Trạng thái"}
                        </span>
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[220px]">
                {STATUS_OPTIONS.map((option) => (
                    <DropdownMenuCheckboxItem
                        key={option.value}
                        checked={selected.includes(option.value)}
                        onCheckedChange={() => toggleStatus(option.value)}
                    >
                        {option.label}
                    </DropdownMenuCheckboxItem>
                ))}
                {selected.length > 0 ? (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onChange(undefined)}>
                            Xóa bộ lọc trạng thái
                        </DropdownMenuItem>
                    </>
                ) : null}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function getTotalAmount(contract: Contract) {
    return contract.total_amount ?? 0
}

function getTotalAmountVnd(contract: Contract) {
    if (contract.total_amount_vnd != null && contract.total_amount_vnd > 0) {
        return contract.total_amount_vnd
    }

    return getTotalAmount(contract) * (contract.exchange_rate ?? contract.currency?.exchange_rate ?? 1)
}

function SummaryCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border bg-background px-4 py-3">
            <div className="text-sm font-medium text-muted-foreground">{label}</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
        </div>
    )
}
