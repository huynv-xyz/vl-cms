import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import { updateProduct, type UpdateProductRequest } from "@/api/product"
import type { Product } from "../data/schema"
import { productSchema, productUiSchema } from "./product-form-schema"
import type { ProductFormValues } from "./types"

export function UpdateProductDialog({ product, open, onOpenChange }: any) {
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
                unit: product.unit ?? "",
                nature: product.nature ?? "",
                group_code: product.group_code ?? "",
                description: product.description ?? "",
                default_warehouse_id: product.default_warehouse_id,
                inventory_account_code: product.inventory_account_code ?? "",
                status: product.status === 1 ? 1 : 0,
            }}
            submitText="Lưu"
            loadingText="Đang lưu..."
            dialogClassName="max-h-[86vh] !w-[calc(100vw-32px)] !max-w-[820px]"
            formClassName="space-y-4 md:[&>div:first-child]:grid md:[&>div:first-child]:grid-cols-2 md:[&>div:first-child]:gap-x-5"
            queryKeyToInvalidate={["product"]}
            mutationFn={updateProduct}
            mapFormToRequest={(v) => ({
                id: product.id,
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
