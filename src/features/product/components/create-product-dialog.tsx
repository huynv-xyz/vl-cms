import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import { createProduct, type CreateProductRequest } from "@/api/product"
import { productSchema, productUiSchema } from "./product-form-schema"
import { toProductNatureValue } from "./product-nature"
import type { ProductFormValues } from "./types"

export function CreateProductDialog({ open, onOpenChange }: any) {
    return (
        <CrudFormDialog<ProductFormValues, CreateProductRequest, unknown>
            title="Tạo sản phẩm"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={productSchema}
            uiSchema={productUiSchema}
            defaultValues={{
                code: "",
                name: "",
                quote_name: "",
                quote_code: "",
                misa_material_code: "",
                unit: "",
                nature: "",
                group_id: undefined,
                pricing_group_id: undefined,
                base_unit_code: "KG",
                sale_unit_factor: 1,
                rounding_mode: "KG_STEP",
                rounding_unit: 1000,
                vat_rate: 5,
                default_warehouse_id: undefined,
                description: "",
                inventory_account_code: "",
                price_method_override: undefined,
                manual_price_vnd: undefined,
                status: 1,
            }}
            submitText="Tạo"
            loadingText="Đang tạo..."
            dialogClassName="max-h-[86vh] !w-[calc(100vw-32px)] !max-w-6xl"
            formClassName="space-y-4"
            objectFieldClassName="grid grid-cols-1 gap-x-5 gap-y-1 md:grid-cols-2 xl:grid-cols-3"
            queryKeyToInvalidate={["product"]}
            mutationFn={createProduct}
            mapFormToRequest={(v) => ({
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
