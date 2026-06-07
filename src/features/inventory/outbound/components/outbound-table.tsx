import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import { CrudTable } from "@/components/crud/crud-table"
import { DatePicker } from "@/components/date-picker"
import { SearchOnBlurInput } from "@/components/search-on-blur-input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { getProduct, listProducts } from "@/api/product"
import { getWarehouse, listWarehouses } from "@/api/warehouse"
import {
    type InventoryVoucher,
    OUTBOUND_VOUCHER_TYPES,
    VOUCHER_TYPE_LABEL,
} from "@/api/inventory/voucher"
import { outboundColumns } from "./outbound-columns"

type Filters = {
    voucher_type?: string
    status?: string
    product_id?: number
    warehouse_id?: number
    from_date?: string
    to_date?: string
}

type Props = {
    data: InventoryVoucher[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
    filters: Filters
    onFiltersChange: (filters: Filters) => void
}

export function OutboundTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
}: Props) {
    const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) =>
        onFiltersChange({ ...filters, [key]: value })

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <div className="flex w-full flex-wrap items-center gap-2">
                    <SearchOnBlurInput
                        value={keyword}
                        onChange={onKeywordChange}
                        placeholder="Tìm số CT, diễn giải, mã hàng..."
                        wrapperClassName="relative h-10 min-w-[280px] flex-[1.5_1_0]"
                        className="h-10 rounded-md border-slate-300 bg-white pl-10 shadow-xs"
                    />

                    <Select
                        value={filters.voucher_type ?? "ALL"}
                        onValueChange={(value) =>
                            setFilter(
                                "voucher_type",
                                value === "ALL" ? undefined : value,
                            )
                        }
                    >
                        <SelectTrigger className="h-10 min-w-[220px] flex-1 rounded-md border-slate-300 bg-white shadow-xs">
                            <SelectValue placeholder="Loại CT" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tất cả loại CT xuất khác</SelectItem>
                            {OUTBOUND_VOUCHER_TYPES.map((code) => (
                                <SelectItem key={code} value={code}>
                                    {VOUCHER_TYPE_LABEL[code] ?? code}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.status ?? "ALL"}
                        onValueChange={(value) =>
                            setFilter("status", value === "ALL" ? undefined : value)
                        }
                    >
                        <SelectTrigger className="h-10 min-w-[160px] flex-1 rounded-md border-slate-300 bg-white shadow-xs">
                            <SelectValue placeholder="Trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                            <SelectItem value="DRAFT">Nháp</SelectItem>
                            <SelectItem value="POSTED">Đã ghi sổ</SelectItem>
                            <SelectItem value="VOID">Đã hủy</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex w-full flex-wrap items-center gap-2">
                    <AsyncSelect
                        className="h-10 min-w-[240px] flex-[1.5_1_0] border-slate-300 bg-white shadow-xs"
                        value={filters.product_id}
                        onChange={(v: number | undefined) =>
                            setFilter("product_id", v || undefined)
                        }
                        placeholder="Sản phẩm"
                        dataSource={{
                            getList: listProducts,
                            getById: getProduct,
                            params: { page: 1, size: 20 },
                        }}
                        mapOption={(p: { id: number; code: string; name: string }) => ({
                            value: p.id,
                            label: `${p.code} - ${p.name}`,
                        })}
                    />

                    <AsyncSelect
                        className="h-10 min-w-[200px] flex-1 border-slate-300 bg-white shadow-xs"
                        value={filters.warehouse_id}
                        onChange={(v: number | undefined) =>
                            setFilter("warehouse_id", v || undefined)
                        }
                        placeholder="Kho"
                        dataSource={{
                            getList: listWarehouses,
                            getById: getWarehouse,
                            params: { page: 1, size: 20 },
                        }}
                        mapOption={(w: { id: number; name: string }) => ({
                            value: w.id,
                            label: w.name,
                        })}
                    />

                    <DatePicker
                        className="min-w-[150px] flex-1 [&_button]:h-10"
                        value={filters.from_date}
                        onChange={(v) => setFilter("from_date", v || undefined)}
                        placeholder="Từ ngày"
                    />

                    <DatePicker
                        className="min-w-[150px] flex-1 [&_button]:h-10"
                        value={filters.to_date}
                        onChange={(v) => setFilter("to_date", v || undefined)}
                        placeholder="Đến ngày"
                    />
                </div>
            </div>

            <CrudTable<InventoryVoucher>
                data={data}
                columns={outboundColumns}
                entityName="phiếu xuất kho khác"
                pagination={pagination}
                onPaginationChange={onPaginationChange}
                pageCount={pageCount}
                showToolbar={false}
            />
        </div>
    )
}
