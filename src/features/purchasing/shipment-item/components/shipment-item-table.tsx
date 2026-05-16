import { CrudTable } from "@/components/crud/crud-table"
import { shipmentItemColumns } from "./shipment-item-columns"
import { formatCurrency, formatNumber } from "@/lib/utils"
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
    const totalQuantity =
        data?.reduce((sum, i) => sum + (i.quantity ?? 0), 0) ?? 0

    return (
        <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
                <Summary label="Số dòng nhập" value={formatNumber(data.length)} />
                <Summary label="Tổng SL nhập" value={formatNumber(totalQuantity)} />
                <Summary label="Tổng tiền" value={formatCurrency(totalAmount)} />
            </div>

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
            />
        </div>
    )
}

function Summary({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border bg-background px-5 py-4">
            <div className="text-base font-medium text-muted-foreground">{label}</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
        </div>
    )
}
