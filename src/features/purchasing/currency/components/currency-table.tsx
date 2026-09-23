import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import { CircleDollarSign } from "lucide-react"

import { MasterDataReportTable } from "@/components/master-data-report-table"
import type { Currency } from "../data/schema"
import { currencyColumns } from "./currency-columns"

type CurrencyTableProps = {
    data: Currency[]
    summaryValue?: number
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
}

export function CurrencyTable(props: CurrencyTableProps) {
    return (
        <MasterDataReportTable<Currency>
            data={props.data}
            columns={currencyColumns}
            entityName="tiền tệ"
            summaryLabel="Tổng tiền tệ"
            summaryValue={props.summaryValue}
            icon={CircleDollarSign}
            searchPlaceholder="Tìm theo mã hoặc tên tiền tệ..."
            pagination={props.pagination}
            onPaginationChange={props.onPaginationChange}
            pageCount={props.pageCount}
            keyword={props.keyword}
            onKeywordChange={props.onKeywordChange}
        />
    )
}
