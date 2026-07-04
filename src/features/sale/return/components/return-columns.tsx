import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Printer } from "lucide-react"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { Button } from "@/components/ui/button"
import type { Return } from "../data/schema"
import { ReturnRowActions } from "./return-row-actions"

import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select"

import { useUpdateStatus } from "@/hooks/use-update-status"
import { updateReturnStatus } from "@/api/sale/return"
import { ReturnDetailDialog } from "../components/return-detail-dialog"
import { RETURN_STATUSES, returnStatusLabel } from "./return-status"

export function useReturnColumns() {
    const [selectedReturn, setSelectedReturn] = useState<{
        id: number
        printOnOpen?: boolean
    } | null>(null)

    const mutation = useUpdateStatus<Return>({
        queryKey: ["returns"],
        mutationFn: updateReturnStatus,
        getId: (x) => x.id,
    })

    const columns: ColumnDef<Return>[] = [
        buildIndexColumn(),

        {
            id: "print",
            header: "",
            size: 44,
            minSize: 44,
            cell: ({ row }) => (
                <div className="flex h-8 w-8 items-center justify-center">
                    {row.original.status === "DONE" && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                            title="In phiếu nhập kho"
                            onClick={(event) => {
                                event.stopPropagation()
                                setSelectedReturn({ id: row.original.id, printOnOpen: true })
                            }}
                        >
                            <Printer className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            ),
        },

        buildTextColumn({
            accessorKey: "return_no",
            title: "Mã trả",
            width: 190,
            render: (row) => (
                <button
                    type="button"
                    className="w-full min-w-0 text-left font-medium text-primary hover:underline"
                    onClick={() => setSelectedReturn({ id: row.id })}
                >
                    <span className="block truncate">{row.return_no}</span>
                    <div className="truncate text-xs font-normal text-muted-foreground">
                        {row.export?.export_no ? `Xuất ${row.export.export_no}` : "Chưa có phiếu xuất"}
                    </div>
                </button>
            ),
        }),

        {
            accessorKey: "order_id",
            header: "Đơn hàng",
            size: 170,
            minSize: 150,
            cell: ({ row }) =>
                <span className="block truncate font-mono text-sm">
                    {row.original.order?.order_no ??
                        (row.original.order_id ? `#${row.original.order_id}` : "-")}
                </span>,
        },

        {
            accessorKey: "customer",
            header: "Khách hàng",
            size: 280,
            minSize: 230,
            cell: ({ row }) => {
                const customer = row.original.customer ?? row.original.order?.customer

                return (
                    <div className="w-full min-w-0">
                        <div className="truncate font-medium text-slate-900">
                            {customer?.name ?? "-"}
                        </div>
                        <div className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                            {customer?.code ?? "-"}
                        </div>
                    </div>
                )
            },
        },

        {
            accessorKey: "export_id",
            header: "Phiếu xuất",
            size: 170,
            minSize: 150,
            cell: ({ row }) =>
                <span className="block truncate font-mono text-sm">
                    {row.original.export?.export_no ??
                        (row.original.export_id ? `#${row.original.export_id}` : "-")}
                </span>,
        },

        buildTextColumn({
            accessorKey: "reason",
            title: "Lý do",
            width: 260,
            className: "max-w-0 truncate",
        }),

        {
            accessorKey: "created_at",
            header: "Ngày trả",
            size: 125,
            minSize: 115,
            cell: ({ row }) => formatReturnDate(row.original.return_date || row.original.created_at),
        },

        {
            accessorKey: "status",
            header: "Trạng thái",
            size: 165,
            minSize: 150,
            cell: ({ row }) => {
                const status = row.original.status
                const isLocked = status === "DONE"

                return (
                    <Select
                        value={status}
                        onValueChange={(v) =>
                            mutation.mutate({
                                id: row.original.id,
                                status: v,
                            })
                        }
                        disabled={mutation.isPending || isLocked}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue>
                                {returnStatusLabel(status)}
                            </SelectValue>
                        </SelectTrigger>

                        <SelectContent>
                            {RETURN_STATUSES.map((s) => (
                                <SelectItem
                                    key={s.value}
                                    value={s.value}
                                    disabled={isLocked}
                                >
                                    {s.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )
            },
        },

        buildActionsColumn({
            renderActions: (_, row) => {
                if (row.original.status === "DONE") return null
                return <ReturnRowActions row={row} />
            },
        }),
    ]

    return {
        columns,
        dialog: (
            <ReturnDetailDialog
                open={!!selectedReturn}
                id={selectedReturn?.id}
                printOnOpen={selectedReturn?.printOnOpen}
                onClose={() => setSelectedReturn(null)}
            />
        ),
    }
}

function formatReturnDate(value?: string | number[]) {
    if (!value) return "-"
    if (Array.isArray(value)) {
        const [year, month, day] = value
        if (!year || !month || !day) return "-"
        return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`
    }

    const [datePart] = value.split("T")
    const normalized = datePart.includes(" ") ? datePart.split(" ")[0] : datePart
    const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (!match) return value
    return `${match[3]}/${match[2]}/${match[1]}`
}
