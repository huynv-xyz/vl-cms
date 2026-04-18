
import { createCrudApi } from "@/api/crud"
import type { Supplier } from "@/features/purchasing/supplier/data/schema"

export type SupplierListParams = {
    page: number
    size: number
    keyword?: string
}

export type CreateSupplierRequest = Partial<Supplier>

export type UpdateSupplierRequest = Supplier

const supplierApi = createCrudApi<
    Supplier,
    CreateSupplierRequest,
    UpdateSupplierRequest,
    SupplierListParams
>("/purchasing/suppliers")

export const listSuppliers = supplierApi.list
export const getSupplier = supplierApi.detail
export const createSupplier = supplierApi.create
export const updateSupplier = supplierApi.update
export const deleteSupplier = supplierApi.delete
