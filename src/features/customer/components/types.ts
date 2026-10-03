import type { CustomerLocationRequest } from "@/api/customer-location"

export type LocationFormState = Omit<CustomerLocationRequest, "customer_id" | "location_verified" | "is_primary"> & { location_verified: boolean; is_primary: boolean }

export const emptyLocationForm: LocationFormState = {
    name: "", address_detail: "",
    latitude: undefined, longitude: undefined, location_accuracy_meters: undefined,
    location_verified: false, is_primary: false, status: 1,
}

export type CustomerFormValues = {
    code: string
    name: string
    address?: string
    phone?: string
    type: string
    region: string
    employee_id?: number
    note?: string
    status?: boolean
    invoice_alias_code?: string
    invoice_alias_name?: string
    invoice_tax_code?: string
    invoice_address?: string
    bank_account?: string
    bank_account_name?: string
    bank_name?: string
}
