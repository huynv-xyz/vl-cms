import type { PaginationState, OnChangeFn } from "@tanstack/react-table"
import { CrudTable } from "@/components/crud/crud-table"
import type { VipRecalcJob } from "../data/schema"
import { vipRecalcJobColumns } from "./vip-recalc-job-columns"

type Props = {
    data: VipRecalcJob[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
}

export function VipRecalcJobTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
}: Props) {
    return (
        <CrudTable<VipRecalcJob>
            data={data}
            columns={vipRecalcJobColumns}
            entityName="lịch sử tính VIP"
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}
        />
    )
}
