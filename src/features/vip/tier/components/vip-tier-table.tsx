import type { PaginationState, OnChangeFn } from "@tanstack/react-table"

import { CrudTable } from "@/components/crud/crud-table"
import type { VipTier } from "../data/schema"
import { vipTierColumns } from "./vip-tier-columns"

type Props = {
    data: VipTier[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
}

export function VipTierTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
}: Props) {
    return (
        <CrudTable<VipTier>
            data={data}
            columns={vipTierColumns}
            entityName="cấp bậc VIP"
            searchPlaceholder="Tìm theo tên hạng..."
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}
            keyword={keyword}
            onKeywordChange={onKeywordChange}
        />
    )
}