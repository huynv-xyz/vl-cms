import { CrudTable } from "@/components/crud/crud-table"
import { shipmentItemColumns } from "./shipment-item-columns"
import { formatCurrency, formatNumber } from "@/lib/utils"
import type { PaginationState, OnChangeFn } from "@tanstack/react-table"
import { ShipmentItem } from "../data/schema"
import { DatePicker } from "@/components/date-picker"
import { AsyncMultiSelect } from "@/components/rjsf/async-multi-select"
import { listSuppliers, getSupplier } from "@/api/purchasing/supplier"
import { getPort, listPorts } from "@/api/purchasing/port"
import { getProduct, listProducts } from "@/api/product"
import { productOption, supplierOption } from "@/lib/option-mapper"

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
        supplier_ids?: string[]
        product_ids?: string[]
        status?: string[]
        port_ids?: string[]
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
                        <AsyncMultiSelect
                            className="w-[220px]"
                            value={filters.product_ids}
                            onChange={(v: any) =>
                                onFiltersChange({
                                    ...filters,
                                    product_ids: v,
                                })
                            }
                            placeholder="Sản phẩm"
                            dataSource={{
                                getList: listProducts,
                                getById: getProduct,
                                params: { page: 1, size: 20 },
                            }}
                            mapOption={productOption}
                        />
                    ),
                },

                // ===== SUPPLIER =====
                {
                    columnId: "supplier",
                    title: "",
                    render: () => (
                        <AsyncMultiSelect
                            className="w-[220px]"
                            value={filters.supplier_ids}
                            onChange={(v: any) =>
                                onFiltersChange({
                                    ...filters,
                                    supplier_ids: v,
                                })
                            }
                            placeholder="Nhà cung cấp"
                            dataSource={{
                                getList: listSuppliers,
                                getById: getSupplier,
                                params: { page: 1, size: 20 },
                            }}
                            mapOption={supplierOption}
                        />
                    ),
                },

                // ===== PORT =====
                {
                    columnId: "port",
                    title: "",
                    render: () => (
                        <AsyncMultiSelect
                            className="w-[200px]"
                            value={filters.port_ids}
                            onChange={(v: any) =>
                                onFiltersChange({
                                    ...filters,
                                    port_ids: v,
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
                    options: [
                        { value: "PLANNED", label: "Kế hoạch" },
                        { value: "IN_TRANSIT", label: "Đang vận chuyển" },
                        { value: "DONE", label: "Hoàn tất" },
                        { value: "CANCELLED", label: "Đã hủy" },
                    ],
                    values: filters.status ?? [],
                    onChange: (status) =>
                        onFiltersChange({
                            ...filters,
                            status,
                        }),
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
                        {formatCurrency(totalAmount)}
                    </span>
                </div>
            }
        />
    )
}
