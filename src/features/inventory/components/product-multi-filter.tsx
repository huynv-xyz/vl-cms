import { getProduct, listProducts } from "@/api/product"
import { AsyncMultiSelect } from "@/components/rjsf/async-multi-select"
import { cn } from "@/lib/utils"

type ProductOptionSource = {
    id?: string | number
    product_id?: string | number
    product?: {
        id?: string | number
        code?: string
        quote_name?: string
        name?: string
    }
    code?: string
    quote_name?: string
    name?: string
}

type ProductMultiFilterProps = {
    value?: string[]
    onChange: (value?: string[]) => void
    className?: string
}

export function ProductMultiFilter({ value, onChange, className }: ProductMultiFilterProps) {
    return (
        <AsyncMultiSelect
            className={cn("h-10 min-w-[280px] flex-[1.8_1_0] border-slate-300 bg-white shadow-xs", className)}
            value={value}
            onChange={(next: string[]) => onChange(next?.length ? next : undefined)}
            searchPlaceholder="Nhập tên sản phẩm..."
            placeholder="Sản phẩm"
            dataSource={{
                getList: listProducts,
                getById: getProduct,
                params: {
                    page: 1,
                    size: 20,
                },
            }}
            mapOption={productOption}
            dedupeByLabel
            deferChange
        />
    )
}

function productOption(x: ProductOptionSource) {
    const product = x.product ?? x
    const productId = x.product_id ?? product.id
    if (!productId) return null

    return {
        value: productId,
        label: product.quote_name || product.name || product.code || "",
        raw: x,
    }
}
