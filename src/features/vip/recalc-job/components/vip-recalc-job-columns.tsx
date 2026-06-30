import { type ColumnDef } from "@tanstack/react-table"

import type { VipRecalcJob } from "../data/schema"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildBadgeColumn } from "@/components/crud/build-badge-column"
import { buildTruncateColumn } from "@/components/crud/build-truncate-column"
import { buildDateTimeColumn } from "@/components/crud/build-date-time-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { DataTableColumnHeader } from "@/components/table/column-header"

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
        case "DONE": return "default"
        case "PROCESSING": return "secondary"
        case "FAILED": return "destructive"
        default: return "outline"
    }
}

function getStatusLabel(status: string): string {
    switch (status) {
        case "PENDING": return "Chờ xử lý"
        case "PROCESSING": return "Đang xử lý"
        case "DONE": return "Hoàn thành"
        case "FAILED": return "Thất bại"
        default: return status
    }
}

function getTriggerLabel(source?: string): string {
    switch (source) {
        case "MANUAL": return "Thủ công"
        case "SCHEDULE": return "Lịch tự động"
        case "API": return "API"
        default:
            return source || "-"
    }
}

function getJobTypeLabel(type?: string): string {
    switch (type) {
        case "FULL_YEAR": return "Toàn năm"
        case "PARTIAL": return "Một phần"
        case "SINGLE_MONTH": return "Theo tháng"
        default:
            return type || "-"
    }
}

function formatDuration(startedAt?: string, finishedAt?: string): string {
    if (!startedAt || !finishedAt) return "-"
    const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime()
    if (ms < 0) return "-"
    if (ms < 1000) return `${ms}ms`
    const s = Math.floor(ms / 1000)
    if (s < 60) return `${s}s`
    const m = Math.floor(s / 60)
    return `${m}m ${s % 60}s`
}

function TruncatedCell({ value, width }: { value: string; width: number }) {
    return (
        <span
            className="block truncate text-sm"
            style={{ maxWidth: `${width}px` }}
            title={value}
        >
            {value}
        </span>
    )
}

export const vipRecalcJobColumns: ColumnDef<VipRecalcJob>[] = [
    buildIndexColumn<VipRecalcJob>(),

    buildTextColumn<VipRecalcJob>({
        accessorKey: "calc_year",
        title: "Năm",
        width: 80,
        maxWidth: 80,
        textClassName: "font-semibold",
    }),

    buildBadgeColumn<VipRecalcJob>({
        accessorKey: "status",
        title: "Trạng thái",
        width: 130,
        mapValueToLabel: (v) => getStatusLabel(String(v ?? "")),
        mapValueToVariant: (v) => getStatusVariant(String(v ?? "")),
    }),

    {
        id: "trigger_source",
        enableSorting: false,
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Nguồn" />
        ),
        cell: ({ row }) => {
            const label = getTriggerLabel(row.original.trigger_source)
            return <TruncatedCell value={label} width={260} />
        },
        size: 280,
        minSize: 280,
        meta: {
            thClassName: "w-[280px] whitespace-nowrap",
            tdClassName: "w-[280px] overflow-hidden",
        },
    },

    {
        id: "job_type",
        enableSorting: false,
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Loại" />
        ),
        cell: ({ row }) => {
            const label = getJobTypeLabel(row.original.job_type)
            return <TruncatedCell value={label} width={250} />
        },
        size: 270,
        minSize: 270,
        meta: {
            thClassName: "w-[270px] whitespace-nowrap",
            tdClassName: "w-[270px] overflow-hidden",
        },
    },

    buildDateTimeColumn<VipRecalcJob>({
        accessorKey: "created_at",
        title: "Tạo lúc",
        width: 155,
    }),

    buildDateTimeColumn<VipRecalcJob>({
        accessorKey: "started_at",
        title: "Bắt đầu",
        width: 155,
    }),

    buildDateTimeColumn<VipRecalcJob>({
        accessorKey: "finished_at",
        title: "Kết thúc",
        width: 155,
    }),

    {
        id: "duration",
        enableSorting: false,
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Thời gian chạy" />
        ),
        cell: ({ row }) => (
            <span className="tabular-nums text-sm text-muted-foreground">
                {formatDuration(row.original.started_at, row.original.finished_at)}
            </span>
        ),
        size: 130,
    },

    buildTruncateColumn<VipRecalcJob>({
        accessorKey: "error_message",
        header: "Lỗi",
        width: 220,
    }),
]
