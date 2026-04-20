import { createCrudApi } from "@/api/crud"
import { Company } from "@/features/company/data/schema"


export type CompanyListParams = {
    page: number
    size: number
    keyword?: string
}

export type CreateCompanyRequest = {
    name: string
    address?: string
}

export type UpdateCompanyRequest = {
    id: number
    name?: string
    address?: string
}

const companyApi = createCrudApi<
    Company,
    CreateCompanyRequest,
    UpdateCompanyRequest,
    CompanyListParams
>("/companies")

export const listCompanies = companyApi.list
export const getCompany = companyApi.detail
export const createCompany = companyApi.create
export const updateCompany = companyApi.update
export const deleteCompany = companyApi.delete