import { CrudTable } from "@/components/crud/crud-table"
import { shipmentColumns } from "./shipment-columns"
import { Shipment } from "../data/schema"
import { formatNumber } from "@/lib/utils"
import { Contract } from "../../contract/data/schema"

export function ShipmentTable(props: any) {
    const { data, contract } = props

    const totalAmount = data.reduce(
        (sum: number, s: any) => sum + (s.total_amount ?? 0),
        0
    )

    return (
        <div className="space-y-2">
            <CrudTable<Shipment>
                {...props as any}
                columns={shipmentColumns}
                entityName="lô hàng"
                searchPlaceholder="Tìm theo mã lô, container..."
                enableExpand
                defaultExpandAll={true}
                renderExpanded={(row) => (
                    <ShipmentItemsInline items={row.items} contract={contract as Contract} />
                )}
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
        </div>
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