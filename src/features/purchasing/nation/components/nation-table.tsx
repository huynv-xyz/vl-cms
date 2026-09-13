import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import { Globe2 } from "lucide-react"

import { MasterDataReportTable } from "@/components/master-data-report-table"
import type { Nation } from "../data/schema"
import { nationColumns } from "./nation-columns"

type NationTableProps = {
    data: Nation[]
    summaryValue?: number
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
}

export function NationTable(props: NationTableProps) {
    return (
        <MasterDataReportTable<Nation>
            data={props.data}
            columns={nationColumns}
            entityName="quốc gia"
            summaryLabel="Tổng quốc gia"
            summaryValue={props.summaryValue}
            icon={Globe2}
            searchPlaceholder="Tìm theo mã hoặc tên quốc gia..."
            pagination={props.pagination}
            onPaginationChange={props.onPaginationChange}
            pageCount={props.pageCount}
            keyword={props.keyword}
            onKeywordChange={props.onKeywordChange}
        />
    )
}
