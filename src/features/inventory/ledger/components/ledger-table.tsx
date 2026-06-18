import type React from "react"
import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import { CalendarDays, Filter } from "lucide-react"

import { getProduct, listProducts } from "@/api/product"
import { getWarehouse, listWarehouses } from "@/api/warehouse"
import { DatePicker } from "@/components/date-picker"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { SearchOnBlurInput } from "@/components/search-on-blur-input"
import { CardPagination } from "@/components/table/card-pagination"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn, formatNumber } from "@/lib/utils"
import type { InventoryLedgerReportRow } from "../data/schema"
import {
    getDocTypeMeta,
    INVENTORY_INBOUND_DOC_TYPES,
    INVENTORY_OUTBOUND_DOC_TYPES,
} from "../data/schema"

type Props = {
    data: InventoryLedgerReportRow[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (v: string) => void
    filters: {
        product_id?: number
        warehouse_id?: number
        doc_type?: string
        from_date?: string
        to_date?: string
    }
    onFiltersChange: (f: Props["filters"]) => void
}

const controlClass = "h-10 min-h-10 rounded-md border-slate-300 bg-white shadow-xs"
const inboundDocValues = new Set(INVENTORY_INBOUND_DOC_TYPES.map((type) => type.value))
const outboundDocValues = new Set(INVENTORY_OUTBOUND_DOC_TYPES.map((type) => type.value))

export function InventoryLedgerTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
}: Props) {
    const currentPage = pagination.pageIndex + 1

    const setFilter = (key: keyof Props["filters"], value: any) => {
        onFiltersChange({
            ...filters,
            [key]: value,
        })
    }

    const setPageIndex = (pageIndex: number) => {
        onPaginationChange((prev) => ({
            ...prev,
            pageIndex: Math.min(Math.max(pageIndex, 0), Math.max(pageCount - 1, 0)),
        }))
    }

    const inboundValue =
        filters.doc_type && inboundDocValues.has(filters.doc_type as any)
            ? filters.doc_type
            : "ALL"
    const outboundValue =
        filters.doc_type && outboundDocValues.has(filters.doc_type as any)
            ? filters.doc_type
            : "ALL"

    return (
        <Card className="border-border/60 gap-0 overflow-hidden py-0 shadow-sm">
            <CardHeader className="gap-3 border-b px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-base">Sổ kho đã ghi nhận</CardTitle>
                        <Badge variant="secondary" className="font-mono text-xs">
                            {formatNumber((data || []).length)} dòng
                        </Badge>
                    </div>
                    <Badge variant="outline" className="w-fit font-mono">
                        Trang {formatNumber(currentPage)} / {formatNumber(Math.max(pageCount, 1))}
                    </Badge>
                </div>

                <div className="bg-muted/40 -mx-4 -mb-3 border-t px-4 py-3">
                    <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs font-semibold uppercase">
                        <Filter className="h-3.5 w-3.5" />
                        Bộ lọc sổ kho
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <SearchOnBlurInput
                            value={keyword}
                            onChange={onKeywordChange}
                            placeholder="Tìm chứng từ, mã hàng, tên hàng..."
                            wrapperClassName="relative h-10 min-w-[220px] flex-[1_1_240px] xl:max-w-[300px]"
                            className={cn(controlClass, "pl-10")}
                        />

                        <AsyncSelect
                            className={cn(controlClass, "min-w-[260px] flex-[1.3_1_280px] py-0 xl:max-w-[380px]")}
                            value={filters.product_id}
                            onChange={(value: any) => setFilter("product_id", value || undefined)}
                            placeholder="Sản phẩm"
                            dataSource={{
                                getList: listProducts,
                                getById: getProduct,
                                params: { page: 1, size: 20 },
                            }}
                            mapOption={(product: any) => ({
                                value: product.id,
                                label: `${product.code} - ${product.name}`,
                            })}
                        />

                        <AsyncSelect
                            className={cn(controlClass, "min-w-[180px] flex-[0.8_1_200px] py-0 xl:max-w-[240px]")}
                            value={filters.warehouse_id}
                            onChange={(value: any) => setFilter("warehouse_id", value || undefined)}
                            placeholder="Kho hàng"
                            dataSource={{
                                getList: listWarehouses,
                                getById: getWarehouse,
                                params: { page: 1, size: 20 },
                            }}
                            mapOption={(warehouse: any) => ({
                                value: warehouse.id,
                                label: warehouse.name,
                            })}
                        />

                        <Select
                            value={inboundValue}
                            onValueChange={(value) => setFilter("doc_type", value === "ALL" ? undefined : value)}
                        >
                            <SelectTrigger className={cn(controlClass, "min-w-[180px] flex-[0.9_1_210px] xl:max-w-[260px]")}>
                                <SelectValue placeholder="Chứng từ nhập" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Tất cả chứng từ nhập</SelectItem>
                                {INVENTORY_INBOUND_DOC_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={outboundValue}
                            onValueChange={(value) => setFilter("doc_type", value === "ALL" ? undefined : value)}
                        >
                            <SelectTrigger className={cn(controlClass, "min-w-[180px] flex-[0.9_1_210px] xl:max-w-[260px]")}>
                                <SelectValue placeholder="Chứng từ xuất" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Tất cả chứng từ xuất</SelectItem>
                                {INVENTORY_OUTBOUND_DOC_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <DatePicker
                            className="min-w-[140px] flex-[0_1_150px] [&_button]:h-10 [&_button]:min-h-10 [&_button]:border-slate-300 [&_button]:bg-white [&_button]:shadow-xs"
                            value={filters.from_date}
                            onChange={(value) => setFilter("from_date", value || undefined)}
                            placeholder="Từ ngày"
                        />

                        <DatePicker
                            className="min-w-[140px] flex-[0_1_150px] [&_button]:h-10 [&_button]:min-h-10 [&_button]:border-slate-300 [&_button]:bg-white [&_button]:shadow-xs"
                            value={filters.to_date}
                            onChange={(value) => setFilter("to_date", value || undefined)}
                            placeholder="Đến ngày"
                        />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1280px] text-sm">
                        <thead className="bg-muted/50 text-muted-foreground border-b text-xs">
                            <tr>
                                <Th className="w-14 text-center">STT</Th>
                                <Th className="w-28">Ngày</Th>
                                <Th className="w-44">Chứng từ</Th>
                                <Th className="min-w-[300px]">Sản phẩm</Th>
                                <Th className="w-20">ĐVT</Th>
                                <Th className="w-32">Số lô</Th>
                                <Th className="w-52">Kho</Th>
                                <Th className="w-28 text-right">Nhập</Th>
                                <Th className="w-28 text-right">Xuất</Th>
                                <Th className="w-32 text-right">Tồn sau</Th>
                                <Th className="w-56">Loại</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {(data || []).map((item, index) => (
                                <LedgerRow
                                    key={`${item.id}-${index}`}
                                    index={pagination.pageIndex * pagination.pageSize + index + 1}
                                    item={item}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>

                {!(data || []).length ? (
                    <div className="text-muted-foreground flex min-h-[180px] items-center justify-center text-sm">
                        Không tìm thấy dòng sổ kho.
                    </div>
                ) : null}
            </CardContent>

            <div className="bg-muted/30 border-t px-4 py-3">
                <CardPagination
                    pageIndex={pagination.pageIndex}
                    pageCount={pageCount}
                    onPageChange={setPageIndex}
                    className="px-0"
                />
            </div>
        </Card>
    )
}

function LedgerRow({
    index,
    item,
}: {
    index: number
    item: InventoryLedgerReportRow
}) {
    const meta = getDocTypeMeta(item.doc_type)
    const quantityIn = Number(item.quantity_in || 0)
    const quantityOut = Number(item.quantity_out || 0)

    return (
        <tr className="hover:bg-muted/30 border-b">
            <Td className="text-muted-foreground text-center font-mono">{formatNumber(index)}</Td>
            <Td>
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <CalendarDays className="text-muted-foreground h-3.5 w-3.5" />
                    {formatDate(item.posting_date)}
                </div>
            </Td>
            <Td>
                <div className="text-primary font-mono font-semibold">{item.doc_no || `#${item.id}`}</div>
            </Td>
            <Td>
                <div className="min-w-0">
                    <div className="font-semibold">{item.product_name || "-"}</div>
                    <div className="text-muted-foreground font-mono text-xs">{item.product_code || "-"}</div>
                </div>
            </Td>
            <Td className="text-muted-foreground">
                {item.unit || "-"}
            </Td>
            <Td className="font-mono text-xs">
                {item.lot_code || "-"}
            </Td>
            <Td>
                <div className="truncate font-medium">{item.warehouse_name || "-"}</div>
            </Td>
            <Td className="text-right">
                <Quantity value={quantityIn} tone="in" />
            </Td>
            <Td className="text-right">
                <Quantity value={quantityOut} tone="out" />
            </Td>
            <Td className="text-right font-bold tabular-nums">
                {formatNumber(Number(item.balance_quantity || 0))}
            </Td>
            <Td>
                <div className="text-muted-foreground line-clamp-2 text-xs leading-4">
                    {meta.label}
                </div>
            </Td>
        </tr>
    )
}

function Quantity({ value, tone }: { value: number; tone: "in" | "out" }) {
    if (!value) return <span className="text-muted-foreground">-</span>

    return (
        <span className={cn("font-semibold tabular-nums", tone === "in" ? "text-emerald-600" : "text-rose-600")}>
            {formatNumber(value)}
        </span>
    )
}

function Th({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
    return <th className={cn("px-3 py-2 text-left font-semibold", className)} {...props} />
}

function Td({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
    return <td className={cn("px-3 py-1.5 align-middle", className)} {...props} />
}

function formatDate(value?: string) {
    if (!value) return "-"
    return value.split("T")[0]
}
