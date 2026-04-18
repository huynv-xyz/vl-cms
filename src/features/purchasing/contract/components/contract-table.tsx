import { CrudTable } from "@/components/crud/crud-table"
import type { Contract } from "../data/schema"
import { contractColumns } from "./contract-columns"
import { formatNumber } from "@/lib/utils"
import type { PaginationState, OnChangeFn } from "@tanstack/react-table"

import { listProducts, getProduct } from "@/api/product"

import { AsyncSelect } from "@/components/rjsf/async-select"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { getSupplier, listSuppliers } from "@/api/purchasing/supplier"
import { DatePicker } from "@/components/date-picker"

type ContractTableProps = {
    data: Contract[]

    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number

    keyword: string
    onKeywordChange: (value: string) => void

    filters: {
        status?: string[]
        product_id?: number
        supplier_id?: number
        signed_date_from?: string
        signed_date_to?: string
    }

    onFiltersChange: (filters: {
        status?: string[]
        product_id?: number
        supplier_id?: number
        signed_date_from?: string
        signed_date_to?: string
    }) => void
}

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

    const totalAmount =
        data?.reduce((sum, c) => sum + (c.total_amount ?? 0), 0) ?? 0

    return (
        <CrudTable<Contract>
            data={data}
            columns={contractColumns}
            entityName="hợp đồng"
            searchPlaceholder="Tìm theo mã hợp đồng..."

            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}

            keyword={keyword}
            onKeywordChange={onKeywordChange}

            filters={[
                {
                    columnId: "product",
                    title: "",
                    render: () => (
                        <AsyncSelect
                            className="w-[300px]"
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

                {
                    columnId: "supplier",
                    title: "",
                    render: () => (
                        <AsyncSelect
                            className="w-[300px]"
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

                /*
                {
                    columnId: "status",
                    title: "",
                    render: () => (
                        <Select
                            value={filters.status?.[0] ?? "ALL"}
                            onValueChange={(v) =>
                                onFiltersChange({
                                    ...filters,
                                    status: v === "ALL" ? undefined : [v],
                                })
                            }
                        >
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="ALL">Trạng thái</SelectItem>
                                <SelectItem value="DRAFT">Nháp</SelectItem>
                                <SelectItem value="SIGNED">Đã ký</SelectItem>
                                <SelectItem value="DONE">Hoàn tất</SelectItem>
                                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                            </SelectContent>
                        </Select>
                    ),
                },*/

                {
                    columnId: "from",
                    title: "",
                    render: () => (
                        <DatePicker
                            value={filters.signed_date_from}
                            onChange={(v) =>
                                onFiltersChange({
                                    ...filters,
                                    signed_date_from: v,
                                })
                            }
                            placeholder="Từ ngày ký HĐ"
                        />
                    ),
                },

                {
                    columnId: "to",
                    title: "",
                    render: () => (
                        <DatePicker
                            value={filters.signed_date_to}
                            onChange={(v) =>
                                onFiltersChange({
                                    ...filters,
                                    signed_date_to: v,
                                })
                            }
                            placeholder="Đến ngày ký HĐ"
                        />
                    ),
                },
            ]}

            enableExpand
            defaultExpandAll

            renderExpanded={(row: any) => (
                <ContractItemsInline
                    contract={row}
                    items={row.items || []}
                    product_id={filters.product_id}
                />
            )}

            footer={
                <div className="flex justify-end w-full">
                    <span className="text-muted-foreground mr-2">
                        Tổng giá trị:
                    </span>
                    <span className="font-bold">
                        {formatNumber(totalAmount)}
                    </span>
                </div>
            }
        />
    )
}

function ContractItemsInline({
    contract,
    items = [],
    product_id,
}: {
    contract: Contract
    items: any[]
    product_id?: number
}) {
    const filteredItems = product_id
        ? items.filter((i) => i.product_id === product_id)
        : items

    if (!filteredItems.length) {
        return (
            <div className="text-sm text-muted-foreground">
                Không có hàng
            </div>
        )
    }

    const totalRow = filteredItems.reduce(
        (acc, i) => {
            acc.quantity += i.quantity ?? 0
            acc.total += i.total_amount ?? 0
            return acc
        },
        {
            quantity: 0,
            total: 0,
        }
    )

    return (
        <div className="p-3 border rounded bg-muted/30">
            <table className="w-full text-sm">
                <thead>
                    <tr>
                        <th className="p-2 text-left">Mã</th>
                        <th className="p-2 text-left">Tên</th>
                        <th className="p-2 text-left">SL mua</th>
                        <th className="p-2 text-left">Đơn vị</th>
                        <th className="p-2 text-left">Đơn giá</th>
                        <th className="p-2 text-left">Sau CK</th>
                        <th className="p-2 text-left">Thành tiền</th>
                    </tr>
                </thead>

                <tbody>
                    {filteredItems.map((i: any) => (
                        <tr key={i.id} className="border-t">
                            <td className="p-2">{i.product?.code}</td>
                            <td className="p-2">{i.product?.name}</td>
                            <td className="p-2">{formatNumber(i.quantity)}</td>
                            <td className="p-2">{i.product?.unit}</td>
                            <td className="p-2">{formatNumber(i.unit_price)}</td>
                            <td className="p-2">{formatNumber(i.base_price)}</td>
                            <td className="p-2 font-bold">
                                {formatNumber(i.total_amount)}
                            </td>
                        </tr>
                    ))}

                    <tr className="border-t bg-muted font-bold">
                        <td colSpan={2} className="p-2">Tổng</td>
                        <td className="p-2">{formatNumber(totalRow.quantity)}</td>
                        <td colSpan={3}></td>
                        <td className="p-2">
                            {formatNumber(totalRow.total)}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}