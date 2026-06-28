import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import { updateProduct, type UpdateProductRequest } from "@/api/product"
import { getProductGroup } from "@/api/product-group"
import type { Product } from "../data/schema"
import { productSchema, productUiSchema } from "./product-form-schema"
import { formatProductNature, toProductNatureValue } from "./product-nature"
import type { ProductFormValues } from "./types"
import { useEffect, useRef } from "react"

export function UpdateProductDialog({ product, open, onOpenChange }: any) {
    const lastGroupIdRef = useRef<number | undefined>(product?.group_id)

    useEffect(() => {
        if (open) lastGroupIdRef.current = product?.group_id
    }, [open, product?.group_id])

    return (
        <CrudFormDialog<ProductFormValues, UpdateProductRequest, unknown>
            title="Cập nhật sản phẩm"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={productSchema}
            uiSchema={productUiSchema}
            defaultValues={{
                code: product.code,
                name: product.name,
                quote_name: product.quote_name ?? "",
                quote_code: product.quote_code ?? "",
                misa_material_code: product.misa_material_code ?? "",
                unit: product.unit ?? "",
                nature: product.nature ? formatProductNature(product.nature) : "",
                group_id: product.group_id,
                pricing_group_id: product.pricing_group_id,
                base_unit_code: product.base_unit_code ?? "KG",
                sale_unit_code: product.sale_unit_code ?? "",
                sale_unit_name: product.sale_unit_name ?? "",
                sale_unit_factor: product.sale_unit_factor ?? 1,
                size_value: product.size_value,
                size_unit_code: product.size_unit_code ?? "",
                rounding_mode: product.rounding_mode ?? "KG_STEP",
                rounding_unit: product.rounding_unit ?? 1000,
                vat_rate: product.vat_rate ?? 5,
                description: product.description ?? "",
                default_warehouse_id: product.default_warehouse_id,
                inventory_account_code: product.inventory_account_code ?? "",
                price_method_override: product.price_method_override ?? undefined,
                manual_price_vnd: product.manual_price_vnd,
                status: product.status === 1 ? 1 : 0,
            }}
            submitText="Lưu"
            loadingText="Đang lưu..."
            dialogClassName="max-h-[86vh] !w-[calc(100vw-32px)] !max-w-6xl"
            formClassName="space-y-4"
            objectFieldClassName="grid grid-cols-1 gap-x-5 gap-y-1 md:grid-cols-2 xl:grid-cols-3"
            queryKeyToInvalidate={["product"]}
            mutationFn={updateProduct}
            onFormChange={async (v) => {
                if (v.group_id === lastGroupIdRef.current) return v
                lastGroupIdRef.current = v.group_id
                if (!v.group_id) return v

                const group = await getProductGroup(v.group_id)
                const standardUnit = normalizeProductUnit((group as any)?.standard_unit)
                return standardUnit ? { ...v, unit: standardUnit } : v
            }}
            mapFormToRequest={(v) => ({
                id: product.id,
                code: v.code,
                name: v.name,
                quote_name: v.quote_name?.trim() || undefined,
                quote_code: v.quote_code?.trim() || undefined,
                misa_material_code: v.misa_material_code?.trim() || undefined,
                unit: v.unit?.trim() || "",
                nature: toProductNatureValue(v.nature?.trim()),
                group_id: v.group_id,
                pricing_group_id: v.pricing_group_id,
                base_unit_code: v.base_unit_code?.trim() || "KG",
                sale_unit_code: v.sale_unit_code?.trim() || undefined,
                sale_unit_name: v.sale_unit_name?.trim() || undefined,
                sale_unit_factor: v.sale_unit_factor || 1,
                size_value: v.size_value,
                size_unit_code: v.size_unit_code?.trim() || undefined,
                rounding_mode: v.rounding_mode?.trim() || "KG_STEP",
                rounding_unit: v.rounding_unit || 1000,
                vat_rate: v.vat_rate ?? 5,
                description: v.description?.trim() || undefined,
                default_warehouse_id: v.default_warehouse_id,
                inventory_account_code: v.inventory_account_code?.trim() || undefined,
                price_method_override: v.price_method_override?.trim() || undefined,
                manual_price_vnd: v.manual_price_vnd,
                status: v.status === 0 ? 0 : 1,
            })}
        />
    )
}

function normalizeProductUnit(value?: string) {
    const normalized = value?.trim().toUpperCase()
    if (!normalized) return ""
    if (normalized === "KG") return "Kg"
    if (normalized === "LIT") return "Lít"
    if (normalized === "TON") return "Tấn"
    return value?.trim() ?? ""
}
