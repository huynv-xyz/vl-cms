import { useEffect, useMemo } from "react"
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    ColumnDef,
} from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { formatNumber } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"
import { getStockLots } from "@/api/inventory/lot"
import { QuantityInputCell } from "./delivery-quantity-input-cell"

type Props = {
    orderItems: any[]
    items: any[]
    warehouseId?: number
    onChange: (items: any[]) => void
}

export function DeliveryItemsEditor({
    orderItems,
    items,
    warehouseId,
    onChange,
}: Props) {

    const productIds = orderItems.map(i => i.product_id)

    const { data: stockRes } = useQuery({
        queryKey: ["stock-lots", warehouseId, productIds],
        queryFn: () =>
            getStockLots({
                warehouse_id: warehouseId!,
                product_ids: productIds,
            }),
        enabled: !!warehouseId && productIds.length > 0,
    })

    const stockMap = useMemo(() => {
        const map = new Map<number, number>()

        stockRes?.forEach((x) => {
            map.set(x.product_id, x.quantity)
        })

        return map
    }, [stockRes])

    const updateRow = (productId: number, patch: any) => {

        const map = new Map(items.map(i => [i.product_id, i]))

        const current = map.get(productId) ?? {
            product_id: productId,
            quantity: 0,
            selected: false,
        }

        const next = { ...current, ...patch }

        const order = orderItems.find(o => o.product_id === productId)

        if (order) {
            const stock = stockMap.get(productId) ?? 0

            const limit = Math.min(order.quantity, stock)

            if (next.quantity > limit) next.quantity = limit
            if (next.quantity < 0) next.quantity = 0
        }

        map.set(productId, next)
        onChange(Array.from(map.values()))
    }

    const data = useMemo(() => {
        return orderItems.map(o => {
            const existing = items.find(i => i.product_id === o.product_id)

            return {
                ...o,
                selected: existing?.selected ?? false,
                quantity_delivery: existing?.quantity ?? 0,
                stock_quantity: stockMap.get(o.product_id) ?? 0,
            }
        })
    }, [orderItems, items, stockMap])

    const columns: ColumnDef<any>[] = [
        {
            header: "Chọn",
            cell: ({ row }) => (
                <Checkbox
                    checked={row.original.selected}
                    onCheckedChange={(checked) =>
                        updateRow(row.original.product_id, {
                            selected: !!checked,
                            quantity: checked ? row.original.quantity : 0,
                        })
                    }
                />
            ),
        },
        {
            header: "Mã",
            cell: ({ row }) => row.original.product?.code,
        },
        {
            header: "Tên",
            cell: ({ row }) => row.original.product?.name,
        },
        {
            header: "ĐVT",
            cell: ({ row }) => row.original.product?.unit,
        },
        {
            header: "SL đặt còn lại",
            cell: ({ row }) => formatNumber(row.original.remain_quantity),
        },
        {
            header: "Tồn kho",
            cell: ({ row }) => (
                <span className="text-blue-600 font-medium">
                    {formatNumber(row.original.stock_quantity)}
                </span>
            ),
        },
        {
            header: "SL giao",
            cell: ({ row }) => {

                const max = Math.min(
                    row.original.quantity,
                    row.original.stock_quantity
                )

                return (
                    <QuantityInputCell
                        productId={row.original.product_id}
                        value={row.original.quantity_delivery}
                        disabled={!row.original.selected}
                        max={row.original.quantity}
                        stock={row.original.stock_quantity ?? 0}
                        onCommit={(productId, quantity) =>
                            updateRow(productId, { quantity })
                        }
                    />
                )
            },
        },
    ]

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        <Table>
            <TableHeader>
                {table.getHeaderGroups().map(hg => (
                    <TableRow key={hg.id}>
                        {hg.headers.map(h => (
                            <TableHead key={h.id}>
                                {flexRender(h.column.columnDef.header, h.getContext())}
                            </TableHead>
                        ))}
                    </TableRow>
                ))}
            </TableHeader>

            <TableBody>
                {table.getRowModel().rows.map(row => (
                    <TableRow key={row.id}>
                        {row.getVisibleCells().map(cell => (
                            <TableCell key={cell.id}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}