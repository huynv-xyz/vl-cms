import { ColumnDef } from "@tanstack/react-table"
import { Link } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { Export } from "../data/schema"
import { getMyPermissions } from "@/api/auth/permission"
import { updateExportStatus } from "@/api/sale/export"
import { ExportRowActions } from "./export-row-actions"
import { EXPORT_STATUSES, exportStatusLabel } from "./export-status"
import { FileText, User } from "lucide-react"
import { toast } from "sonner"

export function useExportColumns() {
    const queryClient = useQueryClient()
    const { data: permissions = [] } = useQuery({
        queryKey: ["my-permissions"],
        queryFn: getMyPermissions,
    })
    const canUpdateStatus = permissions.some(
        (p: any) =>
            p.module === "sales.exports" &&
            (p.action === "status.update" || p.action === "update")
    )
    const { mutate: changeStatus, isPending } = useMutation({
        mutationFn: ({ id, status }: { id: number; status: string; orderId?: number }) =>
            updateExportStatus(id, status),
        onError: (error: any) => {
            toast.error(error?.message || "Cập nhật trạng thái phiếu xuất thất bại")
        },
        onSettled: (_data, _error, variables) => {
            queryClient.invalidateQueries({ queryKey: ["exports"] })
            queryClient.invalidateQueries({ queryKey: ["deliveries"] })
            queryClient.invalidateQueries({ queryKey: ["orders"] })
            if (variables?.orderId) {
                queryClient.invalidateQueries({ queryKey: ["order-detail", variables.orderId] })
            }
        },
    })

    const columns: ColumnDef<Export>[] = [

        buildIndexColumn(),

        buildTextColumn({
            accessorKey: "export_no",
            title: "Số PX",
            width: 190,
            render: (row) => (
                <Link
                    to="/sales/exports/$id"
                    params={{ id: String(row.id) }}
                    className="group inline-flex max-w-[180px] flex-col gap-0.5"
                >
                    <span className="inline-flex min-w-0 items-center gap-1.5 font-mono text-sm font-bold text-primary transition-colors group-hover:underline">
                        <FileText className="h-3.5 w-3.5 opacity-70 transition-opacity group-hover:opacity-100" />
                        <span className="truncate">{row.export_no ?? `#${row.id}`}</span>
                    </span>
                    <span className="truncate text-xs font-normal text-muted-foreground">
                        {row.delivery?.delivery_no
                            ? `Giao ${row.delivery.delivery_no}`
                            : "Chưa có phiếu giao"}
                    </span>
                </Link>
            ),
        }),

        buildTextColumn({
            accessorKey: "export_date",
            title: "Ngày xuất",
            width: 120,
        }),

        buildTextColumn({
            accessorFn: (row) => row.order?.customer?.name,
            title: "Khách hàng",
            width: 360,
            render: (row) => {
                const customer = row.order?.customer
                if (!customer) return <span className="text-muted-foreground">—</span>
                return (
                    <div className="inline-flex w-full min-w-0 max-w-[340px] items-start gap-1.5 text-sm">
                        <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                            <div className="truncate font-medium">{customer.name}</div>
                            {customer.code ? (
                                <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                                    {customer.code}
                                </div>
                            ) : null}
                        </div>
                    </div>
                )
            },
        }),

        buildTextColumn({
            accessorKey: "order_id",
            title: "Đơn hàng",
            width: 180,
            render: (row) => (
                <div className="max-w-[170px]">
                    <div className="truncate font-medium">
                        {row.order?.order_no ?? `#${row.order_id}`}
                    </div>
                </div>
            ),
        }),

        buildTextColumn({
            accessorKey: "delivery_id",
            title: "Phiếu giao",
            width: 170,
            render: (row) =>
                <span className="block max-w-[160px] truncate">
                    {row.delivery?.delivery_no ?? `#${row.delivery_id}`}
                </span>,
        }),

        buildTextColumn({
            accessorKey: "warehouse_id",
            title: "Kho",
            width: 260,
            render: (row) => (
                <span className="block max-w-[250px] truncate">
                    {row.warehouse?.name ?? "—"}
                </span>
            ),
        }),

        {
            accessorKey: "status",
            header: "Trạng thái",
            size: 160,
            minSize: 160,
            cell: ({ row }) => {
                const status = row.original.status || "NEW"
                const allowedNext =
                    status === "NEW"
                        ? ["DONE", "CANCELLED"]
                        : status === "CANCELLED"
                          ? ["NEW"]
                          : []
                return (
                    <Select
                        value={status}
                        disabled={
                            !canUpdateStatus ||
                            isPending ||
                            status === "DONE"
                        }
                        onValueChange={(next) =>
                            changeStatus({
                                id: row.original.id,
                                status: next,
                                orderId: row.original.order_id,
                            })
                        }
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue>
                                {exportStatusLabel(status)}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {EXPORT_STATUSES.map((s) => (
                                <SelectItem
                                    key={s.value}
                                    value={s.value}
                                    disabled={s.value !== status && !allowedNext.includes(s.value)}
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
                return <ExportRowActions row={row} />
            },
        }),
    ]

    return { columns }
}

