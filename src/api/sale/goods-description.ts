import { createCrudApi } from "@/api/crud"
import { apiPostMultipart } from "@/api/client"
import type { GoodsDescription } from "@/features/sale/goods-description/data/schema"

export type GoodsDescriptionListParams = {
    page: number
    size: number
    keyword?: string
    active?: number
}

export type CreateGoodsDescriptionRequest = Partial<GoodsDescription>
export type UpdateGoodsDescriptionRequest = GoodsDescription

const goodsDescriptionApi = createCrudApi<
    GoodsDescription,
    CreateGoodsDescriptionRequest,
    UpdateGoodsDescriptionRequest,
    GoodsDescriptionListParams
>("/sales/goods-descriptions")

export const listGoodsDescriptions = goodsDescriptionApi.list
export const getGoodsDescription = goodsDescriptionApi.detail
export const createGoodsDescription = goodsDescriptionApi.create
export const updateGoodsDescription = goodsDescriptionApi.update
export const deleteGoodsDescription = goodsDescriptionApi.delete

export async function importGoodsDescriptions(file: File) {
    const formData = new FormData()
    formData.append("file", file)

    return apiPostMultipart<{ affected: number }>("/sales/goods-descriptions/import-excel", formData)
}
