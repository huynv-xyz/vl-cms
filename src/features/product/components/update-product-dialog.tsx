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
                status: product.status === 1 ? 1 : 0,
            }}
            submitText="Lưu"
            loadingText="Đang lưu..."
            queryKeyToInvalidate={["product"]}
            mutationFn={updateProduct}
            mapFormToRequest={(v) => ({
                id: product.id,
                code: v.code,
                name: v.name,
                unit: v.unit?.trim() || "",
                status: v.status === 0 ? 0 : 1,
            })}
        />
    )
}