import { CrudTable } from "@/components/crud/crud-table"
import { arLedgerColumns } from "./ar-ledger-columns"
import type { ArLedger } from "../data/schema"
import type { PaginationState, OnChangeFn } from "@tanstack/react-table"
import { DatePicker } from "@/components/date-picker"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { listCustomers, getCustomer } from "@/api/customer"

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
            entityName="công nợ"
            searchPlaceholder="Tìm chứng từ..."

            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}

            keyword={keyword}
            onKeywordChange={onKeywordChange}

            filters={[
                // ===== CUSTOMER =====
                {
                    columnId: "customer",
                    title: "",
                    render: () => (
                        <AsyncSelect
                            className="w-[300px]"
                            value={filters.customer_id}
                            onChange={(v: any) =>
                                onFiltersChange({
                                    ...filters,
                                    customer_id: v || undefined,
                                })
                            }
                            placeholder="Khách hàng"
                            dataSource={{
                                getList: listCustomers,
                                getById: getCustomer,
                                params: { page: 1, size: 20 },
                            }}
                            mapOption={(x: any) => ({
                                value: x.id,
                                label: x.name,
                            })}
                        />
                    ),
                },

                // ===== TYPE =====
                {
                    columnId: "type",
                    title: "",
                    render: () => (
                        <select
                            className="border rounded px-2 py-1 text-sm"
                            value={filters.source_type?.[0] ?? ""}
                            onChange={(e) =>
                                onFiltersChange({
                                    ...filters,
                                    source_type: e.target.value
                                        ? [e.target.value]
                                        : undefined,
                                })
                            }
                        >
                            <option value="">Loại</option>
                            <option value="EXPORT">Bán hàng</option>
                            <option value="RECEIPT">Thu tiền</option>
                            <option value="IMPORT">Import</option>
                        </select>
                    ),
                },

                // ===== FROM DATE =====
                {
                    columnId: "from",
                    title: "",
                    render: () => (
                        <DatePicker
                            value={filters.from_date}
                            onChange={(v) =>
                                onFiltersChange({
                                    ...filters,
                                    from_date: v,
                                })
                            }
                            placeholder="Từ ngày"
                        />
                    ),
                },

                // ===== TO DATE =====
                {
                    columnId: "to",
                    title: "",
                    render: () => (
                        <DatePicker
                            value={filters.to_date}
                            onChange={(v) =>
                                onFiltersChange({
                                    ...filters,
                                    to_date: v,
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