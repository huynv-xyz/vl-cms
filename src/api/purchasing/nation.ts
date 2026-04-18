import { createCrudApi } from "@/api/crud"
import type { Nation } from "@/features/purchasing/nation/data/schema"

export type NationListParams = {
    page: number
    size: number
    keyword?: string
}

export type CreateNationRequest = Partial<Nation>

export type UpdateNationRequest = Nation

const nationApi = createCrudApi<
    Nation,
    CreateNationRequest,
    UpdateNationRequest,
    NationListParams
>("/purchasing/nations")

export const listNations = nationApi.list
export const getNation = nationApi.detail
export const createNation = nationApi.create
export const updateNation = nationApi.update
export const deleteNation = nationApi.delete