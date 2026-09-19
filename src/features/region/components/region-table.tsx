import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import { Globe2 } from "lucide-react"

import { MasterDataReportTable } from "@/components/master-data-report-table"
import type { Region } from "../data/schema"
import { regionColumns } from "./region-columns"

type RegionTableProps = {
    data: Region[]
    summaryValue?: number
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
}

export function RegionTable(props: RegionTableProps) {
    return (
        <MasterDataReportTable<Region>
            data={props.data}
            columns={regionColumns}
            entityName="vùng"
            summaryLabel="Tổng vùng"
            summaryValue={props.summaryValue}
            icon={Globe2}
            searchPlaceholder="Tìm theo mã hoặc tên vùng..."
            pagination={props.pagination}
            onPaginationChange={props.onPaginationChange}
            pageCount={props.pageCount}
            keyword={props.keyword}
            onKeywordChange={props.onKeywordChange}
        />
    )
}
