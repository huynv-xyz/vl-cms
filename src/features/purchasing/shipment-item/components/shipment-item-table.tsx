import { CrudTable } from "@/components/crud/crud-table"
import { shipmentItemColumns } from "./shipment-item-columns"
import { formatNumber } from "@/lib/utils"
import type { PaginationState, OnChangeFn } from "@tanstack/react-table"
import { ShipmentItem } from "../data/schema"

type Props = {
    data: ShipmentItem[]

    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number

    keyword: string
    onKeywordChange: (v: string) => void
}

export function ShipmentItemTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
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