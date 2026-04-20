import { useEffect, useMemo, useState } from "react"
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    ColumnDef,
} from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { formatNumber } from "@/lib/utils"
import type { OrderItem } from "../../order/data/schema"
import type { DeliveryFormItem } from "./types"

type RowData = OrderItem & {
    selected: boolean
    quantity_delivery: number
}

type Props = {
    orderItems: OrderItem[]
    items: DeliveryFormItem[]
    onChange: (items: DeliveryFormItem[]) => void
}

type QuantityInputCellProps = {
    productId: number
    value: number
    disabled: boolean
    max: number
    onCommit: (productId: number, quantity: number) => void
}

function QuantityInputCell({
    productId,
    value,
    disabled,
    max,
    onCommit,
}: QuantityInputCellProps) {
    const [localValue, setLocalValue] = useState(String(value ?? 0))

    useEffect(() => {
        setLocalValue(String(value ?? 0))
    }, [value])

    const commitValue = () => {
        let nextValue = Number(localValue)

        if (Number.isNaN(nextValue) || nextValue < 0) {
            nextValue = 0
        }

        if (nextValue > max) {
            nextValue = max
        }

        setLocalValue(String(nextValue))
        onCommit(productId, nextValue)
    }

    return (
        <Input
            type="number"
            value={localValue}
            disabled={disabled}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={commitValue}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    ; (e.target as HTMLInputElement).blur()
                }
            }}
        />
    )
}

export function DeliveryItemsEditor({ orderItems, items, onChange }: Props) {
    const updateRow = (
        productId: number,
        patch: Partial<DeliveryFormItem>
    ) => {
        const map = new Map(items.map((i) => [i.product_id, i]))

        const current: DeliveryFormItem =
            map.get(productId) ?? {
                product_id: productId,
                quantity: 0,
                selected: false,
                note: "",
            }

        const next: DeliveryFormItem = {
            ...current,
            ...patch,
        }

        const order = orderItems.find((o) => o.product_id === productId)
        if (order && next.quantity > order.quantity) {
            next.quantity = order.quantity
        }

        if (next.quantity < 0) {
            next.quantity = 0
        }

        map.set(productId, next)
        onChange(Array.from(map.values()))
    }

    const data: RowData[] = useMemo(() => {
        return orderItems.map((o) => {
            const existing = items.find((i) => i.product_id === o.product_id)

            return {
                ...o,
                selected: existing?.selected ?? false,
                quantity_delivery: existing?.quantity ?? 0,
            }
        })
    }, [orderItems, items])

    const columns: ColumnDef<RowData>[] = [
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
            header: "SL đặt",
            cell: ({ row }) => (
                <span className="font-medium">
                    {formatNumber(row.original.quantity)}
                </span>
            ),
        },
        {
            header: "SL giao",
            cell: ({ row }) => (
                <QuantityInputCell
                    productId={row.original.product_id}
                    value={row.original.quantity_delivery}
                    disabled={!row.original.selected}
                    max={row.original.quantity}
                    onCommit={(productId, quantity) =>
                        updateRow(productId, { quantity })
                    }
                />
            ),
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
                {table.getHeaderGroups().map((hg) => (
                    <TableRow key={hg.id}>
                        {hg.headers.map((h) => (
                            <TableHead key={h.id}>
                                {flexRender(
                                    h.column.columnDef.header,
                                    h.getContext()
                                )}
                            </TableHead>
                        ))}
                    </TableRow>
                ))}
            </TableHeader>

            <TableBody>
                {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                                {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                )}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}