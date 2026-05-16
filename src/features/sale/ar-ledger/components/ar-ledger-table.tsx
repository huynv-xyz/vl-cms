import type { OnChangeFn, PaginationState } from "@tanstack/react-table"

import { listCustomers, getCustomer } from "@/api/customer"
import { DatePicker } from "@/components/date-picker"
import { CrudTable } from "@/components/crud/crud-table"
import { AsyncSelect } from "@/components/rjsf/async-select"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { ArLedger } from "../data/schema"
import { arLedgerColumns, AR_SOURCE_TYPES } from "./ar-ledger-columns"

type Props = {
    data: ArLedger[]

    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number

    keyword: string
    onKeywordChange: (v: string) => void

    filters: {
        source_type?: string[]
        from_date?: string
        to_date?: string
        customer_id?: number
    }

    onFiltersChange: (f: Props["filters"]) => void
}

export function ArLedgerTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
}: Props) {
    return (
        <CrudTable<ArLedger>
            data={data}
            columns={arLedgerColumns}
            entityName="dòng công nợ"
            searchPlaceholder="Tìm mã chứng từ, khách hàng, diễn giải..."
            searchInputClassName="min-w-[320px]"
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}
            keyword={keyword}
            onKeywordChange={onKeywordChange}
            filters={[
                {
                    columnId: "customer",
                    title: "",
                    render: () => (
                        <AsyncSelect
                            className="w-[280px]"
                            value={filters.customer_id}
                            onChange={(value: any) =>
                                onFiltersChange({
                                    ...filters,
                                    customer_id: value || undefined,
                                })
                            }
                            placeholder="Chọn khách hàng"
                            dataSource={{
                                getList: listCustomers,
                                getById: getCustomer,
                                params: { page: 1, size: 20 },
                            }}
                            mapOption={(customer: any) => ({
                                value: customer.id,
                                label: `${customer.code ? `${customer.code} - ` : ""}${customer.name}`,
                            })}
                        />
                    ),
                },
                {
                    columnId: "source_type",
                    title: "",
                    render: () => (
                        <Select
                            value={filters.source_type?.[0] ?? "ALL"}
                            onValueChange={(value) =>
                                onFiltersChange({
                                    ...filters,
                                    source_type: value === "ALL" ? undefined : [value],
                                })
                            }
                        >
                            <SelectTrigger className="w-[170px]">
                                <SelectValue placeholder="Loại nghiệp vụ" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Tất cả nghiệp vụ</SelectItem>
                                {AR_SOURCE_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ),
                },
                {
                    columnId: "from_date",
                    title: "",
                    render: () => (
                        <DatePicker
                            value={filters.from_date}
                            onChange={(value) =>
                                onFiltersChange({
                                    ...filters,
                                    from_date: value,
                                })
                            }
                            placeholder="Từ ngày"
                        />
                    ),
                },
                {
                    columnId: "to_date",
                    title: "",
                    render: () => (
                        <DatePicker
                            value={filters.to_date}
                            onChange={(value) =>
                                onFiltersChange({
                                    ...filters,
                                    to_date: value,
                                })
                            }
                            placeholder="Đến ngày"
                        />
                    ),
                },
            ]}
        />
    )
}
