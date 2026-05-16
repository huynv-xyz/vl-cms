import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import { createProduct, type CreateProductRequest } from "@/api/product"
import { productSchema, productUiSchema } from "./product-form-schema"
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
                unit: "",
                nature: "",
                group_code: "",
                description: "",
                inventory_account_code: "",
                status: 1,
            }}
            submitText="Tạo"
            loadingText="Đang tạo..."
            dialogClassName="max-h-[86vh] !w-[calc(100vw-32px)] !max-w-[820px]"
            formClassName="space-y-4 md:[&>div:first-child]:grid md:[&>div:first-child]:grid-cols-2 md:[&>div:first-child]:gap-x-5"
            queryKeyToInvalidate={["product"]}
            mutationFn={createProduct}
            mapFormToRequest={(v) => ({
                code: v.code,
                name: v.name,
                unit: v.unit?.trim() || "",
                nature: v.nature?.trim() || undefined,
                group_code: v.group_code?.trim() || undefined,
                description: v.description?.trim() || undefined,
                default_warehouse_id: v.default_warehouse_id,
                inventory_account_code: v.inventory_account_code?.trim() || undefined,
                status: v.status === 0 ? 0 : 1,
            })}
        />
    )
}
