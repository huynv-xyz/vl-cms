import { createCrudApi } from "@/api/crud"
import type { AdministrativeUnit } from "@/api/geography"

export type CustomerLocation = {
    id: number
    customer_id: number
    name: string
    address_detail?: string | null
    raw_address?: string | null
    old_admin_unit_id?: number | null
    current_admin_unit_id?: number | null
    old_admin_unit?: AdministrativeUnit
    current_admin_unit?: AdministrativeUnit
    latitude?: number | null
    longitude?: number | null
    location_accuracy_meters?: number | null
    location_verified: number
    is_primary: number
    status: number
}

export type CustomerLocationRequest = Omit<CustomerLocation, "id" | "old_admin_unit" | "current_admin_unit" | "raw_address"> & { id?: number }
export type CustomerLocationParams = { page: number; size: number; customer_id: number; keyword?: string; status?: number }

const api = createCrudApi<CustomerLocation, CustomerLocationRequest, CustomerLocationRequest & { id: number }, CustomerLocationParams>("/customer-locations")

export const listCustomerLocations = api.list
export const createCustomerLocation = api.create
export const updateCustomerLocation = api.update
export const deleteCustomerLocation = api.delete
