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
    remain_quantity: number // 🔥 thêm
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
// MAIN
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

        const exportItem = exportItems.find(x => x.product_id === productId)

        const remain =
            (exportItem?.quantity ?? 0) -
            (exportItem?.returned_quantity ?? 0) // 🔥 cần BE trả field này

        const next: ReturnFormItem = {
            ...current,
            ...patch,
        }

        // 🔥 clamp theo remain
        if (next.quantity > remain) next.quantity = remain
        if (next.quantity < 0) next.quantity = 0

        map.set(productId, next)
        onChange(Array.from(map.values()))
    }

    const data: RowData[] = useMemo(() => {

        return exportItems
            // 🔥 CHỈ LẤY ITEM CÒN RETURN ĐƯỢC
            .map(e => {

                const returned = e.returned_quantity ?? 0
                const remain = e.quantity - returned

                return {
                    ...e,
                    remain_quantity: remain,
                    selected:
                        items.find(i => i.product_id === e.product_id)?.selected ?? false,
                    quantity_return:
                        items.find(i => i.product_id === e.product_id)?.quantity ?? 0,
                }
            })
            .filter(e => e.remain_quantity > 0) // 🔥 key quan trọng

    }, [exportItems, items])

    const columns: ColumnDef<RowData>[] = [

        {
            header: "Chọn",
            cell: ({ row }) => (
                <Checkbox
                    checked={row.original.selected}
                    onCheckedChange={(checked) =>
                        updateRow(row.original.product_id, {
                            selected: !!checked,
                            quantity: checked ? row.original.remain_quantity : 0,
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
            header: "Đã xuất",
            cell: ({ row }) => formatNumber(row.original.quantity),
        },

        {
            header: "Đã trả",
            cell: ({ row }) =>
                formatNumber(row.original.returned_quantity ?? 0),
        },

        {
            header: "Còn lại",
            cell: ({ row }) => (
                <span className="font-semibold text-orange-500">
                    {formatNumber(row.original.remain_quantity)}
                </span>
            ),
        },

        {
            header: "SL trả",
            cell: ({ row }) => (
                <QuantityInputCell
                    productId={row.original.product_id}
                    value={row.original.quantity_return}
                    disabled={!row.original.selected}
                    max={row.original.remain_quantity}
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