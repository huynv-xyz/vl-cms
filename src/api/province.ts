import { createCrudApi } from "@/api/crud"
import type { Province } from "@/features/province/data/schema"

export type ProvinceListParams = {
    page: number
    size: number
    keyword?: string
    regionId?: number
    status?: number
}

export type CreateProvinceRequest = {
    code: string
    name: string
    regionId?: number
    status?: number
}

export type UpdateProvinceRequest = {
    id: number
    code: string
    name: string
    regionId?: number
    status?: number
}

const provinceApi = createCrudApi<
    Province,
    CreateProvinceRequest,
    UpdateProvinceRequest,
    ProvinceListParams
>("/provinces")

export const listProvinces = provinceApi.list
export const createProvince = provinceApi.create
export const updateProvince = provinceApi.update
export const deleteProvince = provinceApi.delete