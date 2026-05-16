import { createCrudApi } from "@/api/crud"
import type { ProductGroup } from "@/features/product-group/data/schema"

export type ProductGroupListParams = {
    page: number
    size: number
    keyword?: string
    active?: boolean | string
}

export type CreateProductGroupRequest = Partial<ProductGroup>
export type UpdateProductGroupRequest = Partial<ProductGroup> & { id: number }

const productGroupApi = createCrudApi<
    ProductGroup,
    CreateProductGroupRequest,
    UpdateProductGroupRequest,
    ProductGroupListParams
>("/product-groups")

export const listProductGroups = productGroupApi.list
export const getProductGroup = productGroupApi.detail
export const createProductGroup = productGroupApi.create
export const updateProductGroup = productGroupApi.update
export const deleteProductGroup = productGroupApi.delete
export { productGroupApi }
