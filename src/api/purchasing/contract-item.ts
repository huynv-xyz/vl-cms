import { createCrudApi } from "@/api/crud"
import type { ContractItem } from "@/features/purchasing/contract-item/data/schema"

export type ContractItemListParams = {
    page: number
    size: number
    keyword?: string
    contract_id?: number
}

export type CreateContractItemRequest = Partial<ContractItem>
export type UpdateContractItemRequest = ContractItem

const contractItemApi = createCrudApi<
    ContractItem,
    CreateContractItemRequest,
    UpdateContractItemRequest,
    ContractItemListParams
>("/purchasing/contract-items")

export const listContractItems = contractItemApi.list
export const getContractItem = contractItemApi.detail
export const createContractItem = contractItemApi.create
export const updateContractItem = contractItemApi.update
export const deleteContractItem = contractItemApi.delete