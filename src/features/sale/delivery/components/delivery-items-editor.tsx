import { useMemo } from "react"
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
import { Badge } from "@/components/ui/badge"

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

            const remain = Number(order.remain_quantity ?? order.quantity ?? 0)
            const limit = Math.min(remain, stock)

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
                            quantity: checked ? row.original.max_quantity : 0,
                        })
                    }
                />
            ),
        },
        {
            header: "Sản phẩm",
            cell: ({ row }) => (
                <div className="min-w-[260px]">
                    <div className="font-medium text-foreground">
                        {row.original.product?.code ?? `#${row.original.product_id}`}
                    </div>
                    <div className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                        {row.original.product?.name ?? "-"}
                    </div>
                </div>
            ),
        },
        {
            header: "ĐVT",
            cell: ({ row }) => row.original.product?.unit ?? "-",
        },
        {
            header: "Còn phải giao",
            cell: ({ row }) => formatNumber(row.original.max_quantity),
        },
        {
            header: "Tồn kho",
            cell: ({ row }) => (
                <span className={row.original.stock_quantity > 0 ? "font-medium text-blue-600" : "font-medium text-destructive"}>
                    {formatNumber(row.original.stock_quantity)}
                </span>
            ),
        },
        {
            header: "SL giao",
            cell: ({ row }) => {

                return (
                    <QuantityInputCell
                        productId={row.original.product_id}
                        value={row.original.quantity_delivery}
                        disabled={!row.original.selected}
                        max={row.original.max_quantity}
                        stock={row.original.stock_quantity ?? 0}
                        onCommit={(productId, quantity) =>
                            updateRow(productId, { quantity })
                        }
                    />
                )
            },
        },
    ]

    const normalizedData = useMemo(() => {
        return data.map((row) => ({
            ...row,
            max_quantity: Number(row.remain_quantity ?? row.quantity ?? 0),
        }))
    }, [data])

    const selectedRows = normalizedData.filter((row) => row.selected)
    const totalQty = selectedRows.reduce(
        (sum, row) => sum + Number(row.quantity_delivery || 0),
        0
    )

    const table = useReactTable({
        data: normalizedData,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        <div className="rounded-lg border bg-background">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
                <div>
                    <div className="text-base font-semibold">Hàng giao</div>
                    <div className="text-sm text-muted-foreground">
                        Chọn sản phẩm và nhập số lượng giao theo tồn kho hiện có.
                    </div>
                </div>
                <div className="flex gap-2">
                    <Badge variant="secondary">{selectedRows.length} dòng chọn</Badge>
                    <Badge variant="outline">Tổng SL {formatNumber(totalQty)}</Badge>
                </div>
            </div>

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map(hg => (
                            <TableRow key={hg.id}>
                                {hg.headers.map(h => (
                                    <TableHead key={h.id} className="whitespace-nowrap">
                                        {flexRender(h.column.columnDef.header, h.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>

                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map(row => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map(cell => (
                                        <TableCell key={cell.id} className="align-middle">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-28 text-center text-muted-foreground">
                                    Chọn đơn hàng để hiển thị sản phẩm cần giao.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
