import type { PaginationState, OnChangeFn } from "@tanstack/react-table"
import { CrudTable } from "@/components/crud/crud-table"
import type { Transaction } from "../data/schema"
import { transactionColumns } from "./transaction-columns"

type TransactionTableProps = {
    data: Transaction[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
    filters: {
        customer_types?: string[]
        vthh_cons?: string[]
        npps?: string[]
        process_months?: string[]
    }
    onFiltersChange: (filters: {
        customer_types?: string[]
        vthh_cons?: string[]
        npps?: string[]
        process_months?: string[]
    }) => void
}

export function TransactionTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
}: TransactionTableProps) {
    return (
        <CrudTable<Transaction>
            data={data}
            columns={transactionColumns}
            entityName="giao dịch"
            searchPlaceholder="Tìm theo số CT, mã KH, tên KH, mã SP..."
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}
            keyword={keyword}
            onKeywordChange={onKeywordChange}
            searchInputClassName="w-[220px] lg:w-[420px]"
            filters={[
                /*{
                    columnId: "customer_type",
                    title: "Loại KH",
                    values: filters.customer_types ?? [],
                    onChange: (values) =>
                        onFiltersChange({
                            ...filters,
                            customer_types: values,
                        }),
                    options: [
                        { label: "PP", value: "PP" },
                        { label: "PPN.K", value: "PPN.K" },
                        { label: "Đại lý", value: "DAI_LY" },
                    ],
                },
                {
                    columnId: "vthh_con",
                    title: "VTHH con",
                    values: filters.vthh_cons ?? [],
                    onChange: (values) =>
                        onFiltersChange({
                            ...filters,
                            vthh_cons: values,
                        }),
                    options: [
                        { label: "BG_REP", value: "BG_REP" },
                    ],
                },
                {
                    columnId: "npp",
                    title: "NPP",
                    values: filters.npps ?? [],
                    onChange: (values) =>
                        onFiltersChange({
                            ...filters,
                            npps: values,
                        }),
                    options: [
                        { label: "PP", value: "PP" },
                    ],
                },
                {
                    columnId: "process_month",
                    title: "Tháng xử lý",
                    values: filters.process_months ?? [],
                    onChange: (values) =>
                        onFiltersChange({
                            ...filters,
                            process_months: values,
                        }),
                    options: [
                        { label: "202603", value: "202603" },
                    ],
                },*/
            ]}
        />
    )
}