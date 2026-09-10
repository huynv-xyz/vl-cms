
import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import { MapPin } from "lucide-react"

import { MasterDataReportTable } from "@/components/master-data-report-table"
import type { Province } from "../data/schema"
import { provinceColumns } from "./province-columns"

type ProvinceTableProps = {
    data: Province[]
    summaryValue?: number
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
}

export function ProvinceTable(props: ProvinceTableProps) {
    return (
        <MasterDataReportTable<Province>
            data={props.data}
            columns={provinceColumns}
            entityName="khu vực"
            summaryLabel="Tổng khu vực"
            summaryValue={props.summaryValue}
            icon={MapPin}
            searchPlaceholder="Tìm theo code hoặc tên..."
            pagination={props.pagination}
            onPaginationChange={props.onPaginationChange}
            pageCount={props.pageCount}
            keyword={props.keyword}
            onKeywordChange={props.onKeywordChange}
        />
    )
}
