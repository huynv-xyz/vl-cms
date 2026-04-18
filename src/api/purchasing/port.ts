import { createCrudApi } from "@/api/crud"
import { Port } from "@/features/purchasing/port/data/schema"

export type PortListParams = {
    page: number
    size: number
    keyword?: string
}

export type CreatePortRequest = Partial<Port>

export type UpdatePortRequest = Port

const portApi = createCrudApi<
    Port,
    CreatePortRequest,
    UpdatePortRequest,
    PortListParams
>("/purchasing/ports")

export const listPorts = portApi.list
export const getPort = portApi.detail
export const createPort = portApi.create
export const updatePort = portApi.update
export const deletePort = portApi.delete