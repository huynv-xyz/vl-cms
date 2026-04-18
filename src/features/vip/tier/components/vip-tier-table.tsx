import type { PaginationState, OnChangeFn } from "@tanstack/react-table"

import { CrudTable } from "@/components/crud/crud-table"
import type { VipTier } from "../data/schema"
import { vipTierColumns } from "./vip-tier-columns"

type Props = {
    data: VipTier[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
}

export function VipTierTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
}: Props) {
    return (
        <CrudTable<VipTier>
            data={data}
            columns={vipTierColumns}
            entityName="vip tier"
            searchPlaceholder="Tìm theo tên hạng..."
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}
        />
    )
}