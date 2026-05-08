import { CrudTable } from "@/components/crud/crud-table"
import type { PaginationState, OnChangeFn } from "@tanstack/react-table"
import { DatePicker } from "@/components/date-picker"
import { shipmentColumns } from "./shipment-columns"
import { Contract } from "../../contract/data/schema"
import { formatNumber } from "@/lib/utils"

type Props = {
    data: any[]

    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number

    keyword: string
    onKeywordChange: (v: string) => void

    filters: {
        status?: string[]
        eta_from?: string
        eta_to?: string
        supplier_id?: number
    }

    onFiltersChange: (f: any) => void
}

export function ShipmentTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
}: Props) {

    return (
        <CrudTable
            data={data}
            columns={shipmentColumns}
            entityName="lô hàng"
            searchPlaceholder="Nhập mã để tìm ..."

            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}

            keyword={keyword}
            onKeywordChange={onKeywordChange}
            filters={[
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
        />
    )
}


function ShipmentItemsInline({ items = [], contract }: { items: any[]; contract: Contract }) {
    if (!items?.length) {
        return <div className="text-sm text-muted-foreground">Không có hàng</div>
    }

    return (
        <div className="p-3 border rounded bg-muted/30">
            <table className="w-full text-sm">
                <thead>
                    <tr>
                        <th className="p-2 text-left">Mã SP</th>
                        <th className="p-2 text-left">Tên sản phẩm</th>

                        <th className="p-2 text-left">SL nhập</th>
                        <th className="p-2 text-left">Sl lỗi</th>
                        <th className="p-2 text-left">Số thực tế</th>

                        <th className="p-2 text-left">Giá gốc</th>
                        <th className="p-2 text-left">Chiết khấu</th>
                        <th className="p-2 text-left">Thuế nhập khẩu</th>
                        <th className="p-2 text-left">VAT</th>

                        <th className="p-2 text-left">Đơn giá sau thuế</th>
                        <th className="p-2 text-left">Thành tiền</th>
                    </tr>
                </thead>

                <tbody>
                    {items.map((i: any) => {
                        const q = i.quantity ?? 0
                        const d = i.defect_quantity ?? 0
                        const realQty = Math.max(q - d, 0)

                        return (
                            <tr key={i.id} className="border-t">
                                <td className="p-2">{i.product?.code}</td>
                                <td className="p-2">{i.product?.name}</td>

                                <td className="p-2">{formatNumber(q)}</td>

                                <td className="p-2 text-red-500">
                                    {formatNumber(d)}
                                </td>

                                <td className="p-2 font-medium">
                                    {formatNumber(realQty)}
                                </td>

                                <td className="p-2">
                                    {formatNumber(i.unit_price)}
                                </td>

                                <td className="p-2 text-orange-500">
                                    {formatNumber(i.discount_amount)}
                                </td>

                                <td className="p-2">
                                    {formatNumber(contract.import_tax_rate)}
                                </td>

                                <td className="p-2">
                                    {formatNumber(contract.vat_rate)}
                                </td>

                                <td className="p-2 font-medium">
                                    {formatNumber(i.final_price)}
                                </td>

                                <td className="p-2 font-bold">
                                    {formatNumber(i.total_price)}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}