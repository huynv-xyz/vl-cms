import { useMemo } from "react"
import { flushSync } from "react-dom"
import { useQueries } from "@tanstack/react-query"
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    ColumnDef,
} from "@tanstack/react-table"
import { AlertTriangle, CheckCircle2 } from "lucide-react"

import { getStockLots } from "@/api/inventory/lot"
import { getWarehouse, listWarehouses } from "@/api/warehouse"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { formatNumber } from "@/lib/utils"
import { QuantityInputCell } from "./delivery-quantity-input-cell"

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
    const updateRow = (orderItemId: number, patch: any) => {
        const map = new Map(items.map((item) => [item.order_item_id, item]))
        const order = orderItems.find((item) => Number(item.id) === Number(orderItemId))
        const current = map.get(orderItemId) ?? {
            order_item_id: orderItemId,
            product_id: order?.product_id,
            quantity: 0,
            selected: false,
        }

        const next = { ...current, ...patch }
        if (next.quantity < 0) next.quantity = 0

        map.set(orderItemId, next)
        onChange(Array.from(map.values()))
    }

    const data = useMemo(() => {
        return orderItems.map((orderItem) => {
            const existing = items.find((item) => Number(item.order_item_id) === Number(orderItem.id))
            const warehouse = existing?.warehouse ?? orderItem.product?.default_warehouse

            return {
                ...orderItem,
                order_item_id: orderItem.id,
                selected: existing?.selected ?? false,
                quantity_delivery: existing?.quantity ?? 0,
                warehouse_id: existing?.warehouse_id ?? orderItem.product?.default_warehouse_id,
                warehouse,
            }
        })
    }, [orderItems, items])

    const normalizedData = useMemo(() => {
        return data.map((row) => ({
            ...row,
            max_quantity: Number(row.remain_quantity ?? row.quantity ?? 0),
        }))
    }, [data])

    const selectableRows = normalizedData.filter((row) => Number(row.max_quantity || 0) > 0)
    const selectedRows = normalizedData.filter((row) => row.selected)
    const selectedSelectableRows = selectableRows.filter((row) => row.selected)
    const allSelectableSelected =
        selectableRows.length > 0 && selectedSelectableRows.length === selectableRows.length
    const someSelectableSelected =
        selectedSelectableRows.length > 0 && selectedSelectableRows.length < selectableRows.length

    const selectedPhysicalWarehouses = selectedRows
        .map((row) => getPhysicalWarehouse(row.warehouse))
        .filter(Boolean) as Array<{ id?: number; name?: string }>
    const selectedPhysicalIds = Array.from(
        new Set(selectedPhysicalWarehouses.map((warehouse) => warehouse.id).filter(Boolean))
    )
    const selectedPhysicalWarehouseId = selectedPhysicalIds.length === 1 ? selectedPhysicalIds[0] : undefined
    const selectedPhysicalWarehouseLabel =
        selectedPhysicalIds.length > 1
            ? "Nhiều địa điểm kho"
            : selectedPhysicalWarehouses[0]?.name || "Chưa chọn địa điểm kho"

    const stockQueries = useQueries({
        queries: normalizedData.map((row) => ({
            queryKey: ["delivery-row-stock", row.product_id, row.warehouse_id],
            enabled: Boolean(row.selected && row.product_id && row.warehouse_id),
            queryFn: async () => {
                const rows = await getStockLots({
                    warehouse_id: Number(row.warehouse_id),
                    product_ids: [Number(row.product_id)],
                })
                return Number(rows?.find((item: any) => Number(item.product_id) === Number(row.product_id))?.quantity || 0)
            },
            staleTime: 30_000,
        })),
    })

    const stockByOrderItemId = useMemo(() => {
        const map = new Map<number, number>()
        normalizedData.forEach((row, index) => {
            const queried = stockQueries[index]?.data
            map.set(
                Number(row.order_item_id),
                queried != null ? Number(queried) : Number(row.available_quantity || row.stock_quantity || 0)
            )
        })
        return map
    }, [normalizedData, stockQueries])

    const setAllRowsSelected = (checked: boolean) => {
        const map = new Map(items.map((item) => [item.order_item_id, item]))

        for (const row of selectableRows) {
            const current = map.get(row.order_item_id) ?? {
                order_item_id: row.order_item_id,
                product_id: row.product_id,
                quantity: 0,
                selected: false,
            }

            map.set(row.order_item_id, {
                ...current,
                selected: checked,
                quantity: checked
                    ? Number(current.quantity || 0) > 0
                        ? current.quantity
                        : row.max_quantity
                    : 0,
                warehouse_id: row.warehouse_id,
                warehouse: row.warehouse,
            })
        }

        onChange(Array.from(map.values()))
    }

    const columns: ColumnDef<any>[] = [
        {
            id: "selected",
            header: () => (
                <div className="flex items-center justify-center">
                    <Checkbox
                        checked={
                            allSelectableSelected
                                ? true
                                : someSelectableSelected
                                    ? "indeterminate"
                                    : false
                        }
                        disabled={!selectableRows.length}
                        onCheckedChange={(checked) => setAllRowsSelected(checked === true)}
                        aria-label="Chọn tất cả sản phẩm"
                    />
                </div>
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.original.selected}
                    onCheckedChange={(checked) =>
                        updateRow(row.original.order_item_id, {
                            selected: !!checked,
                            quantity: checked ? row.original.max_quantity : 0,
                            warehouse_id: row.original.warehouse_id,
                            warehouse: row.original.warehouse,
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
                        {row.original.product?.name ?? "-"}
                    </div>
                    <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {row.original.product?.code ?? `#${row.original.product_id}`}
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
                <div className="min-w-[220px]">
                    <AsyncSelect
                        placeholder="Chọn kho xuất"
                        searchPlaceholder="Tìm kho"
                        value={row.original.warehouse_id}
                        disabled={!row.original.selected}
                        onChange={(warehouseId: number | undefined, option: any) =>
                            updateRow(row.original.order_item_id, {
                                warehouse_id: warehouseId || undefined,
                                warehouse: option?.raw,
                            })
                        }
                        dataSource={{
                            getList: listWarehouses,
                            getById: getWarehouse,
                            params: {
                                page: 1,
                                size: 20,
                                ...(selectedPhysicalWarehouseId
                                    ? { physical_warehouse_id: selectedPhysicalWarehouseId }
                                    : {}),
                            },
                        }}
                        mapOption={warehouseNameOption}
                        wrapLabel
                        popoverContentClassName="w-[360px]"
                    />
                </div>
            ),
        },
        {
            header: "SL giao",
            cell: ({ row }) => (
                <QuantityInputCell
                    productId={row.original.order_item_id}
                    value={row.original.quantity_delivery}
                    disabled={!row.original.selected}
                    max={row.original.max_quantity}
                    onCommit={(productId, quantity) =>
                        flushSync(() => updateRow(productId, { quantity }))
                    }
                />
            ),
        },
        {
            header: "Tồn kho",
            cell: ({ row }) => {
                const available = stockByOrderItemId.get(Number(row.original.order_item_id)) ?? 0
                const shortage = row.original.selected && Number(row.original.quantity_delivery || 0) > available

                return (
                    <div className="min-w-[120px] text-right">
                        <div className={shortage ? "font-semibold text-rose-600" : "font-medium text-muted-foreground"}>
                            {row.original.warehouse_id ? formatNumber(available) : "-"}
                        </div>
                        {row.original.selected && row.original.warehouse_id && (
                            <div className={`mt-0.5 inline-flex items-center gap-1 text-xs ${shortage ? "text-rose-600" : "text-emerald-600"}`}>
                                {shortage ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                {shortage ? "Vượt tồn" : "Đạt tồn"}
                            </div>
                        )}
                    </div>
                )
            },
        },
    ]

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
                        Tại địa điểm kho: <span className="font-medium text-foreground">{selectedPhysicalWarehouseLabel}</span>
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
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="whitespace-nowrap text-center">
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>

                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
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

function getPhysicalWarehouse(warehouse: any) {
    if (!warehouse) return null
    if (warehouse.physical_warehouse) {
        return {
            id: warehouse.physical_warehouse.id ?? warehouse.physical_warehouse_id,
            name: warehouse.physical_warehouse.name,
        }
    }
    if (warehouse.physical_warehouse_id) {
        return {
            id: warehouse.physical_warehouse_id,
            name: `Địa điểm kho #${warehouse.physical_warehouse_id}`,
        }
    }
    return null
}

function warehouseNameOption(warehouse: any) {
    if (!warehouse) return null
    return {
        value: warehouse.id,
        label: warehouse.name || warehouse.code || `#${warehouse.id}`,
        raw: warehouse,
    }
}
