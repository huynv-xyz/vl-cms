import { type ColumnDef } from "@tanstack/react-table"

import type { VipRecalcJob } from "../data/schema"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildBadgeColumn } from "@/components/crud/build-badge-column"
import { buildTruncateColumn } from "@/components/crud/build-truncate-column"
import { buildDateTimeColumn } from "@/components/crud/build-date-time-column"

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
        case "DONE":
            return "default"
        case "PROCESSING":
            return "secondary"
        case "FAILED":
            return "destructive"
        default:
            return "outline"
    }
}

function getStatusLabel(status: string): string {
    switch (status) {
        case "PENDING":
            return "Chờ xử lý"
        case "PROCESSING":
            return "Đang xử lý"
        case "DONE":
            return "Hoàn thành"
        case "FAILED":
            return "Thất bại"
        default:
            return status
    }
}

export const vipRecalcJobColumns: ColumnDef<VipRecalcJob>[] = [
    buildIndexColumn<VipRecalcJob>(),

    buildTextColumn<VipRecalcJob>({
        accessorKey: "id",
        title: "ID",
        width: 80,
        maxWidth: 80,
        textClassName: "font-medium text-sm",
    }),

    buildTextColumn<VipRecalcJob>({
        accessorKey: "calc_year",
        title: "Năm",
        width: 90,
        maxWidth: 90,
    }),

    buildBadgeColumn<VipRecalcJob>({
        accessorKey: "status",
        title: "Trạng thái",
        width: 130,
        mapValueToLabel: (v) => getStatusLabel(String(v ?? "")),
        mapValueToVariant: (v) => getStatusVariant(String(v ?? "")),
    }),

    buildTextColumn<VipRecalcJob>({
        accessorKey: "trigger_source",
        title: "Nguồn kích hoạt",
        width: 160,
        maxWidth: 160,
    }),

    buildTextColumn<VipRecalcJob>({
        accessorKey: "job_type",
        title: "Loại job",
        width: 140,
        maxWidth: 140,
    }),

    buildDateTimeColumn<VipRecalcJob>({
        accessorKey: "created_at",
        title: "Tạo lúc",
        width: 160,
    }),

    buildDateTimeColumn<VipRecalcJob>({
        accessorKey: "started_at",
        title: "Bắt đầu",
        width: 160,
    }),

    buildDateTimeColumn<VipRecalcJob>({
        accessorKey: "finished_at",
        title: "Kết thúc",
        width: 160,
    }),

    buildTruncateColumn<VipRecalcJob>({
        accessorKey: "error_message",
        header: "Lỗi",
        width: 220,
    }),
]
