import type { PaginationState, OnChangeFn } from "@tanstack/react-table"
import { CrudTable } from "@/components/crud/crud-table"
import type { VipProductMapping } from "../data/schema"
import { vipProductMappingColumns } from "./vip-product-mapping-columns"

type Props = {
    data: VipProductMapping[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
}

export function VipProductMappingTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
}: Props) {
    return (
        <CrudTable<VipProductMapping>
            data={data}
            columns={vipProductMappingColumns}
            entityName="quy tắc điểm hàng hóa"
            searchPlaceholder="Tìm theo sản phẩm..."
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}
            keyword={keyword}
            onKeywordChange={onKeywordChange}
        />
    )
}
