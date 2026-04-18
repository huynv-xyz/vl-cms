
import { createCrudApi } from "@/api/crud"
import type { Region } from "@/features/region/data/schema"

export type RegionListParams = {
    page: number
    size: number
    keyword?: string
}

export type CreateRegionRequest = Partial<Region>

export type UpdateRegionRequest = Region

const regionApi = createCrudApi<
    Region,
    CreateRegionRequest,
    UpdateRegionRequest,
    RegionListParams
>("/regions")

export const listRegions = regionApi.list
export const createRegion = regionApi.create
export const updateRegion = regionApi.update
export const deleteRegion = regionApi.delete
