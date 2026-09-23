import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import { FileText } from "lucide-react"

import { MasterDataReportTable } from "@/components/master-data-report-table"
import type { GoodsDescription } from "../data/schema"
import { goodsDescriptionColumns } from "./goods-description-columns"

type GoodsDescriptionTableProps = {
    data: GoodsDescription[]
    summaryValue?: number
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
}

export function GoodsDescriptionTable(props: GoodsDescriptionTableProps) {
    return (
        <MasterDataReportTable<GoodsDescription>
            data={props.data}
            columns={goodsDescriptionColumns}
            entityName="mô tả HH"
            summaryLabel="Tổng mô tả HH"
            summaryValue={props.summaryValue}
            icon={FileText}
            searchPlaceholder="Tìm mô tả HH..."
            pagination={props.pagination}
            onPaginationChange={props.onPaginationChange}
            pageCount={props.pageCount}
            keyword={props.keyword}
            onKeywordChange={props.onKeywordChange}
        />
    )
}
