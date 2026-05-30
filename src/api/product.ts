import { createCrudApi } from "@/api/crud"
import type { Product } from "@/features/product/data/schema"
import { apiPostMultipart } from "./client"

export type ProductListParams = {
    page: number
    size: number
    keyword?: string
    code?: string
    name?: string
    status?: string
    nature?: string
    group_code?: string
    default_warehouse_id?: number
    inventory_account_code?: string
}

export type CreateProductRequest = Partial<Product>
export type UpdateProductRequest = Product

const productApi = createCrudApi<
    Product,
    CreateProductRequest,
    UpdateProductRequest,
    ProductListParams
>("/products")

export const listProducts = productApi.list
export const getProduct = productApi.detail
export const createProduct = productApi.create
export const updateProduct = productApi.update
export const deleteProduct = productApi.delete

export async function importProducts(file: File) {
    const formData = new FormData()
    formData.append("file", file)

    return apiPostMultipart<{ affected: number }>("/products/import-csv", formData)
}
