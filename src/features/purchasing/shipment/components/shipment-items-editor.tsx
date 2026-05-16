import { useEffect, useMemo, useState } from "react"
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
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
import type { ShipmentFormItem } from "./types"
import { formatNumber } from "@/lib/utils"

type Props = {
    items: ShipmentFormItem[]
    onChange: (items: ShipmentFormItem[]) => void
    contract?: {
        vat_rate?: number
        import_tax_rate?: number
    }
}

type NumberCellProps = {
    value?: number
    disabled?: boolean
    onCommit: (value: number) => void
}

function NumberCell({ value, disabled, onCommit }: NumberCellProps) {
    const [localValue, setLocalValue] = useState(String(value ?? 0))

    useEffect(() => {
        setLocalValue(String(value ?? 0))
    }, [value])

    const commit = () => {
        const num = Number(localValue || 0)
        onCommit(Number.isNaN(num) ? 0 : num)
    }

    return (
        <Input
            value={localValue}
            disabled={disabled}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    ; (e.target as HTMLInputElement).blur()
                }
            }}
        />
    )
}

export function ShipmentItemsEditor({ items, onChange, contract }: Props) {
    const updateRow = (index: number, patch: Partial<ShipmentFormItem>) => {
        const next = [...items]

        const updated = { ...next[index], ...patch }

        if (
            updated.defect_quantity != null &&
            updated.quantity != null &&
            updated.defect_quantity > updated.quantity
        ) {
            updated.defect_quantity = updated.quantity
        }

        next[index] = updated
        onChange(next)
    }

    const calcFinalPrice = (row: ShipmentFormItem) => {
        const unit = row.unit_price ?? 0
        const pack = row.packaging_price ?? 0
        const freight = row.freight_price ?? 0

        const base = unit + pack + freight

        const vatRate = contract?.vat_rate ?? 0
        const importRate = contract?.import_tax_rate ?? 0

        const importTax = (base * importRate) / 100
        const vat = ((base + importTax) * vatRate) / 100

        return base + importTax + vat
    }

    const columns = useMemo(
        () => [
            {
                id: "selected",
                header: "Chọn",
                cell: ({ row }: any) => (
                    <Checkbox
                        checked={!!row.original.selected}
                        onCheckedChange={(checked) =>
                            updateRow(row.index, {
                                selected: !!checked,
                                quantity: checked ? (row.original.quantity ?? 0) : 0,
                            })
                        }
                    />
                ),
            },

            {
                header: "Mã",
                cell: ({ row }: any) => row.original.product?.code,
            },

            {
                header: "Tên",
                cell: ({ row }: any) => row.original.product?.name,
            },

            {
                header: "ĐVT",
                cell: ({ row }: any) => row.original.product?.unit,
            },

            {
                header: "Số lượng",
                cell: ({ row }: any) => (
                    <NumberCell
                        value={row.original.quantity}
                        disabled={!row.original.selected}
                        onCommit={(value) =>
                            updateRow(row.index, {
                                quantity: value,
                            })
                        }
                    />
                ),
            },

            {
                header: "Số lượng lỗi",
                cell: ({ row }: any) => (
                    <NumberCell
                        value={row.original.defect_quantity}
                        disabled={!row.original.selected}
                        onCommit={(value) =>
                            updateRow(row.index, {
                                defect_quantity: value,
                            })
                        }
                    />
                ),
            },

            {
                header: "Đơn giá",
                cell: ({ row }: any) => (
                    <NumberCell
                        value={row.original.unit_price}
                        disabled={!row.original.selected}
                        onCommit={(value) =>
                            updateRow(row.index, {
                                unit_price: value,
                            })
                        }
                    />
                ),
            },

            {
                header: "SL thực",
                cell: ({ row }: any) => {
                    const q = row.original.quantity ?? 0
                    const d = row.original.defect_quantity ?? 0
                    return Math.max(q - d, 0)
                },
            },

            {
                header: "Thuế",
                cell: ({ row }: any) => {
                    const unit = row.original.unit_price ?? 0
                    const pack = row.original.packaging_price ?? 0
                    const freight = row.original.freight_price ?? 0

                    const base = unit + pack + freight

                    const vatRate = contract?.vat_rate ?? 0
                    const importRate = contract?.import_tax_rate ?? 0

                    const importTax = (base * importRate) / 100
                    const vat = ((base + importTax) * vatRate) / 100

                    return (
                        <span className={vatRate || importRate ? "text-orange-600" : ""}>
                            {formatNumber(importTax + vat)}
                        </span>
                    )
                },
            },

            {
                header: "Thành tiền",
                cell: ({ row }: any) => {
                    const q = row.original.quantity ?? 0
                    const d = row.original.defect_quantity ?? 0
                    const realQty = Math.max(q - d, 0)

                    const finalPrice = calcFinalPrice(row.original)

                    return formatNumber(realQty * finalPrice)
                },
            },
        ],
        [items, contract]
    )

    const table = useReactTable({
        data: items,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    if (!items.length) {
        return (
            <div className="rounded-md border bg-background px-4 py-8 text-center">
                <h3 className="font-semibold">Chưa có hàng hóa để tạo lô</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Vui lòng thêm hàng hóa ở tab Hàng hóa của hợp đồng trước khi tạo lô hàng.
                </p>
            </div>
        )
    }

    return (
        <div className="rounded-md border bg-background">
            <div className="border-b px-4 py-3">
                <h3 className="font-semibold">Hàng hóa trong lô</h3>
                <p className="text-sm text-muted-foreground">
                    Chọn sản phẩm và nhập số lượng thực đi theo lô hàng.
                </p>
            </div>
            <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((hg) => (
                        <TableRow key={hg.id}>
                            {hg.headers.map((h) => (
                                <TableHead key={h.id}>
                                    {flexRender(h.column.columnDef.header, h.getContext())}
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
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            </div>
        </div>
    )
}
