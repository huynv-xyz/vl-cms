import { CrudTable } from "@/components/crud/crud-table"
import { shipmentItemColumns } from "./shipment-item-columns"
import { formatNumber } from "@/lib/utils"
import type { PaginationState, OnChangeFn } from "@tanstack/react-table"
import { ShipmentItem } from "../data/schema"
import { DatePicker } from "@/components/date-picker"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { listSuppliers, getSupplier } from "@/api/purchasing/supplier"
import { getPort, listPorts } from "@/api/purchasing/port"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { getProduct, listProducts } from "@/api/product"

type Props = {
    data: ShipmentItem[]

    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number

    keyword: string
    onKeywordChange: (v: string) => void

    filters: {
        eta_from?: string
        eta_to?: string
        supplier_id?: number
        product_id?: number
        status?: string[]
        port_id?: number
    }

    onFiltersChange: (f: Props["filters"]) => void
}

export function ShipmentItemTableV2({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
}: Props) {

    const totalAmount =
        data?.reduce((sum, i) => {
            const q = i.quantity ?? 0
            const d = i.defect_quantity ?? 0
            const real = Math.max(q - d, 0)

            const price =
                (i.unit_price ?? 0) +
                (i.packaging_price ?? 0) +
                (i.freight_price ?? 0)

            return sum + real * price
        }, 0) ?? 0

    return (
        <CrudTable<ShipmentItem>
            data={data}
            columns={shipmentItemColumns}
            entityName="hàng nhập"
            searchPlaceholder="Tìm theo mã SP, tên SP..."

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
                            className="w-[220px]"
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

                // ===== SUPPLIER =====
                {
                    columnId: "supplier",
                    title: "",
                    render: () => (
                        <AsyncSelect
                            className="w-[220px]"
                            value={filters.supplier_id}
                            onChange={(v: any) =>
                                onFiltersChange({
                                    ...filters,
                                    supplier_id: v || undefined,
                                })
                            }
                            placeholder="Nhà cung cấp"
                            dataSource={{
                                getList: listSuppliers,
                                getById: getSupplier,
                                params: { page: 1, size: 20 },
                            }}
                            mapOption={(x: any) => ({
                                value: x.id,
                                label: x.name,
                            })}
                        />
                    ),
                },

                // ===== PORT =====
                {
                    columnId: "port",
                    title: "",
                    render: () => (
                        <AsyncSelect
                            className="w-[200px]"
                            value={filters.port_id}
                            onChange={(v: any) =>
                                onFiltersChange({
                                    ...filters,
                                    port_id: v || undefined,
                                })
                            }
                            placeholder="Cảng đến"
                            dataSource={{
                                getList: listPorts,
                                getById: getPort,
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
                            value={filters.status?.[0] ?? ""}
                            onValueChange={(v) =>
                                onFiltersChange({
                                    ...filters,
                                    status: v ? [v] : undefined,
                                })
                            }
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="PLANNED">Kế hoạch</SelectItem>
                                <SelectItem value="IN_TRANSIT">Đang vận chuyển</SelectItem>
                                <SelectItem value="DONE">Hoàn tất</SelectItem>
                                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                            </SelectContent>
                        </Select>
                    ),
                },

                // ===== ETA FROM =====
                {
                    columnId: "eta_from",
                    title: "",
                    render: () => (
                        <DatePicker
                            value={filters.eta_from}
                            onChange={(v) =>
                                onFiltersChange({
                                    ...filters,
                                    eta_from: v,
                                })
                            }
                            placeholder="Ngày đi"
                        />
                    ),
                },

                {
                    columnId: "eta_to",
                    title: "",
                    render: () => (
                        <DatePicker
                            value={filters.eta_to}
                            onChange={(v) =>
                                onFiltersChange({
                                    ...filters,
                                    eta_to: v,
                                })
                            }
                            placeholder="Ngày đến"
                        />
                    ),
                },
            ]}

            footer={
                <div className="flex justify-end w-full">
                    <span className="text-muted-foreground mr-2">
                        Tổng tiền:
                    </span>
                    <span className="font-bold">
                        {formatNumber(totalAmount)}
                    </span>
                </div>
            }
        />
    )
}