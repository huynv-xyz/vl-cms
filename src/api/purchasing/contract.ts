
import { createCrudApi } from "@/api/crud"
import type { Contract } from "@/features/purchasing/contract/data/schema"

export type ContractListParams = {
    page: number
    size: number
    keyword?: string
    status?: string
    product_ids?: string
    supplier_ids?: string
    nation_ids?: string
    signed_date_from?: string
    signed_date_to?: string
}

export type CreateContractRequest = Partial<Contract>

export type UpdateContractRequest = Contract

const contractApi = createCrudApi<
    Contract,
    CreateContractRequest,
    UpdateContractRequest,
    ContractListParams
>("/purchasing/contracts")

export const listContracts = contractApi.list
export const getContract = contractApi.detail
export const createContract = contractApi.create
export const updateContract = contractApi.update
export const deleteContract = contractApi.delete
