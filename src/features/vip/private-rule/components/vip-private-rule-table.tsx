import type { PaginationState, OnChangeFn } from "@tanstack/react-table"

import { CrudTable } from "@/components/crud/crud-table"
import type { VipPrivateRule } from "../data/schema"
import { vipPrivateRuleColumns } from "./vip-private-rule-columns"

type VipPrivateRuleTableProps = {
    data: VipPrivateRule[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
}

export function VipPrivateRuleTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
}: VipPrivateRuleTableProps) {
    return (
        <CrudTable<VipPrivateRule>
            data={data}
            columns={vipPrivateRuleColumns}
            entityName="vip private rule"
            searchPlaceholder="Tìm theo code, tên..."
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}
        />
    )
}