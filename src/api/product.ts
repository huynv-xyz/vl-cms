
import { createCrudApi } from "@/api/crud"
import type { Product } from "@/features/product/data/schema"

export type ProductListParams = {
    page: number
    size: number
    keyword?: string
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
