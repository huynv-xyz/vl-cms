import { CrudTable } from "@/components/crud/crud-table"
import { DatePicker } from "@/components/date-picker"
import { AsyncMultiSelect } from "@/components/rjsf/async-multi-select"
import { getProduct, listProducts } from "@/api/product"
import { getNation, listNations } from "@/api/purchasing/nation"
import { getSupplier, listSuppliers } from "@/api/purchasing/supplier"
import { nationOption, productOption, supplierOption } from "@/lib/option-mapper"
import { formatCurrency, formatNumber } from "@/lib/utils"
import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import type { Contract } from "../data/schema"
import { contractColumns } from "./contract-columns"

type ContractFilters = {
    status?: string[]
    product_ids?: string[]
    supplier_ids?: string[]
    nation_ids?: string[]
    signed_date_from?: string
    signed_date_to?: string
}

type ContractTableProps = {
    data: Contract[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
    filters: ContractFilters
    onFiltersChange: (filters: ContractFilters) => void
}

export function ContractTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
}: ContractTableProps) {
    const totalAmount = data.reduce((sum, c) => sum + getTotalAmount(c), 0)
    const totalAmountVnd = data.reduce((sum, c) => sum + getTotalAmountVnd(c), 0)
    const totalQuantity = data.reduce((sum, c) => sum + (c.total_quantity ?? 0), 0)
    const supplierCount = new Set(data.map((c) => c.supplier_id).filter(Boolean)).size

    return (
        <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
                <SummaryCard label="Hợp đồng đang xem" value={formatNumber(data.length)} />
                <SummaryCard label="Nhà cung cấp" value={formatNumber(supplierCount)} />
                <SummaryCard label="Tổng SL hợp đồng" value={formatNumber(totalQuantity)} />
            </div>

            <CrudTable<Contract>
                data={data}
                columns={contractColumns}
                entityName="hợp đồng"
                searchPlaceholder="Tìm theo mã hợp đồng, nhà cung cấp..."
                pagination={pagination}
                onPaginationChange={onPaginationChange}
                pageCount={pageCount}
                keyword={keyword}
                onKeywordChange={onKeywordChange}
                filters={[
                    {
                        columnId: "product",
                        title: "",
                        render: () => (
                            <AsyncMultiSelect
                                className="w-[300px]"
                                value={filters.product_ids}
                                onChange={(v: any) =>
                                    onFiltersChange({
                                        ...filters,
                                        product_ids: v,
                                    })
                                }
                                placeholder="Sản phẩm"
                                dataSource={{
                                    getList: listProducts,
                                    getById: getProduct,
                                    params: { page: 1, size: 20 },
                                }}
                                mapOption={productOption}
                            />
                        ),
                    },
                    {
                        columnId: "supplier",
                        title: "",
                        render: () => (
                            <AsyncMultiSelect
                                className="w-[300px]"
                                value={filters.supplier_ids}
                                onChange={(v: any) =>
                                    onFiltersChange({
                                        ...filters,
                                        supplier_ids: v,
                                    })
                                }
                                placeholder="Nhà cung cấp"
                                dataSource={{
                                    getList: listSuppliers,
                                    getById: getSupplier,
                                    params: { page: 1, size: 20 },
                                }}
                                mapOption={supplierOption}
                            />
                        ),
                    },
                    {
                        columnId: "nation",
                        title: "",
                        render: () => (
                            <AsyncMultiSelect
                                className="w-[220px]"
                                value={filters.nation_ids}
                                onChange={(v: any) =>
                                    onFiltersChange({
                                        ...filters,
                                        nation_ids: v,
                                    })
                                }
                                placeholder="Quốc gia"
                                dataSource={{
                                    getList: listNations,
                                    getById: getNation,
                                    params: { page: 1, size: 20 },
                                }}
                                mapOption={nationOption}
                            />
                        ),
                    },
                    {
                        columnId: "from",
                        title: "",
                        render: () => (
                            <DatePicker
                                value={filters.signed_date_from}
                                onChange={(v) =>
                                    onFiltersChange({
                                        ...filters,
                                        signed_date_from: v,
                                    })
                                }
                                placeholder="Từ ngày ký HĐ"
                            />
                        ),
                    },
                    {
                        columnId: "to",
                        title: "",
                        render: () => (
                            <DatePicker
                                value={filters.signed_date_to}
                                onChange={(v) =>
                                    onFiltersChange({
                                        ...filters,
                                        signed_date_to: v,
                                    })
                                }
                                placeholder="Đến ngày ký HĐ"
                            />
                        ),
                    },
                ]}
                footer={
                    <div className="flex w-full flex-wrap justify-end gap-4">
                        <div>
                            <span className="mr-2 text-muted-foreground">Tổng tiền:</span>
                            <span className="font-bold">{formatCurrency(totalAmount)}</span>
                        </div>
                        <div>
                            <span className="mr-2 text-muted-foreground">Tổng VNĐ:</span>
                            <span className="font-bold">{formatCurrency(totalAmountVnd)}</span>
                        </div>
                    </div>
                }
            />
        </div>
    )
}

function getTotalAmount(contract: Contract) {
    return contract.total_amount ?? 0
}

function getTotalAmountVnd(contract: Contract) {
    if (contract.total_amount_vnd != null && contract.total_amount_vnd > 0) {
        return contract.total_amount_vnd
    }

    return getTotalAmount(contract) * (contract.exchange_rate ?? contract.currency?.exchange_rate ?? 1)
}

function SummaryCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border bg-background px-4 py-3">
            <div className="text-sm font-medium text-muted-foreground">{label}</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
        </div>
    )
}
