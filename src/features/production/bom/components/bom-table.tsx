import type { OnChangeFn, PaginationState } from "@tanstack/react-table"

import { getProduct, listProducts } from "@/api/product"
import { CrudTable } from "@/components/crud/crud-table"
import { AsyncSelect } from "@/components/rjsf/async-select"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { Product } from "@/features/product/data/schema"
import type { ProductBom } from "../data/schema"
import { productBomColumns } from "./bom-columns"

type ProductBomFilters = {
    product_id?: number
    active?: string
}

type ProductBomTableProps = {
    data: ProductBom[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
    filters: ProductBomFilters
    onFiltersChange: (filters: ProductBomFilters) => void
}

const mapProductOption = (x: Product) => ({
    value: x.id,
    label: `${x.code} - ${x.name}`,
})

export function ProductBomTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
}: ProductBomTableProps) {
    return (
        <CrudTable<ProductBom>
            data={data}
            columns={productBomColumns}
            entityName="BOM"
            searchPlaceholder="Tìm theo mã, tên thành phẩm hoặc phiên bản..."
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}
            keyword={keyword}
            onKeywordChange={onKeywordChange}
            filters={[
                {
                    columnId: "product_id",
                    title: "",
                    render: () => (
                        <AsyncSelect
                            className="w-[320px]"
                            value={filters.product_id}
                            onChange={(value: number | undefined) =>
                                onFiltersChange({
                                    ...filters,
                                    product_id: value || undefined,
                                })
                            }
                            placeholder="Thành phẩm"
                            searchPlaceholder="Tìm thành phẩm"
                            dataSource={{
                                getList: listProducts,
                                getById: getProduct,
                                params: { page: 1, size: 20 },
                            }}
                            mapOption={mapProductOption}
                        />
                    ),
                },
                {
                    columnId: "active",
                    title: "",
                    render: () => (
                        <Select
                            value={filters.active || "ALL"}
                            onValueChange={(value) =>
                                onFiltersChange({
                                    ...filters,
                                    active: value === "ALL" ? undefined : value,
                                })
                            }
                        >
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="ALL">Trạng thái</SelectItem>
                                <SelectItem value="true">Active</SelectItem>
                                <SelectItem value="false">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    ),
                },
            ]}
        />
    )
}
