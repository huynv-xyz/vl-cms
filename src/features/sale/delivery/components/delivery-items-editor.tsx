import { useMemo } from "react"
import { flushSync } from "react-dom"
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
import { AsyncSelect } from "@/components/rjsf/async-select"
import { getWarehouse, listWarehouses } from "@/api/warehouse"
import { warehouseOption } from "@/lib/option-mapper"
import { QuantityInputCell } from "./delivery-quantity-input-cell"
import { Badge } from "@/components/ui/badge"

type Props = {
    orderItems: any[]
    items: any[]
    onChange: (items: any[]) => void
}

export function DeliveryItemsEditor({
    orderItems,
    items,
    onChange,
}: Props) {

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
            // Chỉ giới hạn theo số lượng còn phải giao của đơn hàng,
            // không kiểm tra tồn kho.
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
                warehouse_id: existing?.warehouse_id ?? o.product?.default_warehouse_id,
            }
        })
    }, [orderItems, items])

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
                            warehouse_id: checked
                                ? row.original.warehouse_id
                                : row.original.warehouse_id,
                        })
                    }
                />
            ),
        },
        {
            header: "Sản phẩm",
            cell: ({ row }) => (
                <div className="min-w-[240px]">
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
            header: "Kho xuất",
            cell: ({ row }) => (
                <div className="min-w-[200px]">
                    <AsyncSelect
                        placeholder="Chọn kho xuất"
                        value={row.original.warehouse_id}
                        disabled={!row.original.selected}
                        onChange={(warehouseId: number | undefined) =>
                            updateRow(row.original.product_id, {
                                warehouse_id: warehouseId || undefined,
                            })
                        }
                        dataSource={{
                            getList: listWarehouses,
                            getById: getWarehouse,
                            params: { page: 1, size: 20 },
                        }}
                        mapOption={warehouseOption}
                    />
                </div>
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
                        onCommit={(productId, quantity) =>
                            flushSync(() => updateRow(productId, { quantity }))
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
                        Chọn sản phẩm, kho xuất và số lượng giao cho từng dòng.
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
