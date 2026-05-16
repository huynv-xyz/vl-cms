import { CrudTable } from "@/components/crud/crud-table"
import type React from "react"
import type { Production } from "../data/schema"
import { productionColumns } from "./production-columns"
import { formatNumber } from "@/lib/utils"
import type { PaginationState, OnChangeFn } from "@tanstack/react-table"

import { listProducts, getProduct } from "@/api/product"
import { listWarehouses, getWarehouse } from "@/api/warehouse"

import { AsyncSelect } from "@/components/rjsf/async-select"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { DatePicker } from "@/components/date-picker"

type ProductionTableProps = {
    data: Production[]

    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number

    keyword: string
    onKeywordChange: (value: string) => void

    filters: {
        product_id?: number
        warehouse_id?: number
        status?: string
        from_date?: string
        to_date?: string
    }

    onFiltersChange: (filters: {
        product_id?: number
        warehouse_id?: number
        status?: string
        from_date?: string
        to_date?: string
    }) => void
}

export function ProductionTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
}: ProductionTableProps) {

    const totalPlan = data.reduce(
        (sum, item) => sum + sumItems(item.items ?? [], "quantity_plan"),
        0
    )
    const totalDone = data.reduce(
        (sum, item) => sum + sumItems(item.items ?? [], "quantity_done"),
        0
    )
    const materialGenerated = data.filter((item) =>
        ["MATERIAL_GENERATED", "FIFO_ALLOCATED", "OUTPUT_RECEIVED", "DONE"].includes(
            String(item.status ?? "").toUpperCase()
        )
    ).length
    const shortageRows = data.reduce(
        (sum, item) =>
            sum +
            (item.items ?? []).reduce(
                (childSum, productionItem) =>
                    childSum +
                    (productionItem.materials ?? []).filter((m) => Number(m.shortage_quantity) > 0).length,
                0
            ),
        0
    )

    return (
        <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
                <SummaryCard label="Số lệnh" value={formatNumber(data.length)} />
                <SummaryCard label="Tổng SL kế hoạch" value={formatNumber(totalPlan)} />
                <SummaryCard label="Tổng SL nhập TP" value={formatNumber(totalDone)} />
                <SummaryCard
                    label="Dòng thiếu tồn"
                    value={formatNumber(shortageRows)}
                    tone={shortageRows > 0 ? "bad" : "ok"}
                />
            </div>

            <CrudTable<Production>
                data={data}
                columns={productionColumns}
                entityName="lệnh sản xuất"
                searchPlaceholder="Tìm theo mã lệnh..."

                pagination={pagination}
                onPaginationChange={onPaginationChange}
                pageCount={pageCount}

                keyword={keyword}
                onKeywordChange={onKeywordChange}

                filters={[
                // ===== PRODUCT =====
                {
                    columnId: "product",
                    title: "",
                    render: () => (
                        <AsyncSelect
                            className="w-[280px]"
                            value={filters.product_id}
                            onChange={(v: any) =>
                                onFiltersChange({
                                    ...filters,
                                    product_id: v || undefined,
                                })
                            }
                            placeholder="Sản phẩm"
                            dataSource={{
                                getList: listProducts,
                                getById: getProduct,
                                params: { page: 1, size: 20 },
                            }}
                            mapOption={(x: any) => ({
                                value: x.id,
                                label: `${x.code} - ${x.name}`,
                            })}
                        />
                    ),
                },

                // ===== WAREHOUSE =====
                {
                    columnId: "warehouse",
                    title: "",
                    render: () => (
                        <AsyncSelect
                            className="w-[240px]"
                            value={filters.warehouse_id}
                            onChange={(v: any) =>
                                onFiltersChange({
                                    ...filters,
                                    warehouse_id: v || undefined,
                                })
                            }
                            placeholder="Kho"
                            dataSource={{
                                getList: listWarehouses,
                                getById: getWarehouse,
                                params: { page: 1, size: 20 },
                            }}
                            mapOption={(x: any) => ({
                                value: x.id,
                                label: x.name,
                            })}
                        />
                    ),
                },

                // ===== STATUS =====
                {
                    columnId: "status",
                    title: "",
                    render: () => (
                        <Select
                            value={filters.status ?? "ALL"}
                            onValueChange={(v) =>
                                onFiltersChange({
                                    ...filters,
                                    status: v === "ALL" ? undefined : v,
                                })
                            }
                        >
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="ALL">Trạng thái</SelectItem>
                                <SelectItem value="DRAFT">Nháp</SelectItem>
                                <SelectItem value="PLANNED">Kế hoạch</SelectItem>
                                <SelectItem value="MATERIAL_GENERATED">Đã sinh vật tư</SelectItem>
                                <SelectItem value="FIFO_ALLOCATED">Đã chạy FIFO</SelectItem>
                                <SelectItem value="OUTPUT_RECEIVED">Đã nhập TP</SelectItem>
                                <SelectItem value="CANCELLED">Huỷ</SelectItem>
                            </SelectContent>
                        </Select>
                    ),
                },

                // ===== DATE FROM =====
                {
                    columnId: "from",
                    title: "",
                    render: () => (
                        <DatePicker
                            className="w-[120px]"
                            value={filters.from_date}
                            onChange={(v) =>
                                onFiltersChange({
                                    ...filters,
                                    from_date: v,
                                })
                            }
                            placeholder="Từ ngày"
                        />
                    ),
                },

                // ===== DATE TO =====
                {
                    columnId: "to",
                    title: "",
                    render: () => (
                        <DatePicker
                            className="w-[120px]"
                            value={filters.to_date}
                            onChange={(v) =>
                                onFiltersChange({
                                    ...filters,
                                    to_date: v,
                                })
                            }
                            placeholder="Đến ngày"
                        />
                    ),
                },
                ]}

                footer={
                    <div className="flex w-full flex-wrap justify-end gap-6">
                        <div>
                        <span className="text-muted-foreground mr-2">
                            Tổng KH:
                        </span>
                            <span className="font-bold">
                                {formatNumber(totalPlan)}
                            </span>
                        </div>

                        <div>
                        <span className="text-muted-foreground mr-2">
                            Tổng nhập TP:
                        </span>
                            <span className="font-bold">
                                {formatNumber(totalDone)}
                            </span>
                        </div>

                        <div>
                            <span className="mr-2 text-muted-foreground">
                                Đã sinh vật tư:
                            </span>
                            <span className="font-bold">
                                {formatNumber(materialGenerated)}
                            </span>
                        </div>
                    </div>
                }
            />
        </div>
    )
}

function SummaryCard({
    label,
    value,
    tone,
}: {
    label: string
    value: React.ReactNode
    tone?: "ok" | "bad"
}) {
    return (
        <div className="rounded-md border bg-background px-4 py-3">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </div>
            <div
                className={
                    tone === "bad"
                        ? "mt-1 text-xl font-semibold text-destructive"
                        : tone === "ok"
                            ? "mt-1 text-xl font-semibold text-emerald-600"
                            : "mt-1 text-xl font-semibold"
                }
            >
                {value}
            </div>
        </div>
    )
}

function sumItems(items: Production["items"], key: keyof NonNullable<Production["items"]>[number]) {
    return (items ?? []).reduce((sum, item) => sum + (Number(item[key]) || 0), 0)
}
