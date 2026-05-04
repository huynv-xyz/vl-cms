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
import type { ExportItem } from "../../export/data/schema"
import type { ReturnFormItem } from "./types"

type RowData = ExportItem & {
    selected: boolean
    quantity_return: number
}

type Props = {
    exportItems: ExportItem[]
    items: ReturnFormItem[]
    onChange: (items: ReturnFormItem[]) => void
}

// ========================
// INPUT CELL
// ========================
function QuantityInputCell({
    productId,
    value,
    disabled,
    max,
    onCommit,
}: any) {

    const [localValue, setLocalValue] = useState(String(value ?? 0))

    useEffect(() => {
        setLocalValue(String(value ?? 0))
    }, [value])

    const commitValue = () => {

        let next = Number(localValue)

        if (Number.isNaN(next) || next < 0) next = 0
        if (next > max) next = max

        setLocalValue(String(next))
        onCommit(productId, next)
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

// ========================
// MAIN EDITOR
// ========================
export function ReturnItemsEditor({
    exportItems,
    items,
    onChange,
}: Props) {

    const updateRow = (
        productId: number,
        patch: Partial<ReturnFormItem>
    ) => {

        const map = new Map(items.map(i => [i.product_id, i]))

        const current: ReturnFormItem =
            map.get(productId) ?? {
                product_id: productId,
                quantity: 0,
                selected: false,
                note: "",
            }

        const next: ReturnFormItem = {
            ...current,
            ...patch,
        }

        const exportItem = exportItems.find(x => x.product_id === productId)

        if (exportItem && next.quantity > exportItem.quantity) {
            next.quantity = exportItem.quantity
        }

        if (next.quantity < 0) {
            next.quantity = 0
        }

        map.set(productId, next)
        onChange(Array.from(map.values()))
    }

    const data: RowData[] = useMemo(() => {

        return exportItems.map(e => {

            const existing = items.find(i => i.product_id === e.product_id)

            return {
                ...e,
                selected: existing?.selected ?? false,
                quantity_return: existing?.quantity ?? 0,
            }
        })

    }, [exportItems, items])

    const columns: ColumnDef<RowData>[] = [

        // checkbox
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

        // product code
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

        // exported quantity
        {
            header: "SL đã xuất",
            cell: ({ row }) => (
                <span className="font-medium">
                    {formatNumber(row.original.quantity)}
                </span>
            ),
        },

        // return quantity
        {
            header: "SL trả",
            cell: ({ row }) => (
                <QuantityInputCell
                    productId={row.original.product_id}
                    value={row.original.quantity_return}
                    disabled={!row.original.selected}
                    max={row.original.quantity}
                    onCommit={(productId: number, quantity: number) =>
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
                {table.getHeaderGroups().map(hg => (
                    <TableRow key={hg.id}>
                        {hg.headers.map(h => (
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
                {table.getRowModel().rows.map(row => (
                    <TableRow key={row.id}>
                        {row.getVisibleCells().map(cell => (
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