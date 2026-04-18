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
                status: 1,
            }}
            submitText="Tạo"
            loadingText="Đang tạo..."
            queryKeyToInvalidate={["product"]}
            mutationFn={createProduct}
            mapFormToRequest={(v) => ({
                code: v.code,
                name: v.name,
                unit: v.unit?.trim() || "",
                status: v.status === 0 ? 0 : 1,
            })}
        />
    )
}