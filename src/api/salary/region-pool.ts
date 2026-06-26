import { apiDelete, apiGet, apiPost, apiPut, type PagedResult } from "@/api/client"

export type RegionPoolItem = {
  region_code: string
  rm_employee_id: number
  rm_code: string
  rm_name: string
  total_region_pool: number
  rm_share_rate: number
  rm_mgr_pool: number
  rm_personal_pool: number
  rm_total_pool: number
  sale_count: number
}

export type RegionPoolResult = {
  period: string
  items: RegionPoolItem[]
  total: number
}

export type RegionSupportItem = {
  id: number
  region_code: string | null
  province_code: string | null
  role_code: string | null
  amount: number
  effective_from: string
  effective_to: string | null
  status: number
  note: string | null
}

export type RegionSupportResult = {
  items: RegionSupportItem[]
  total: number
}

export type RegionSupportRequest = {
  region_code?: string
  province_code?: string
  role_code?: string
  amount: number
  effective_from: string
  effective_to?: string | null
  note?: string
}

export type SalaryRole = {
  id: number
  code: string
  name: string
  type?: string
  status?: number
}

export function getRegionPool(period: string) {
  return apiGet<RegionPoolResult>(`/salary/region-pool/${period}`)
}

export function listRegionSupports(period: string) {
  return apiGet<RegionSupportResult>("/salary/support", { period })
}

export function createRegionSupport(body: RegionSupportRequest) {
  return apiPost<unknown>("/salary/support", body)
}

export function updateRegionSupport(id: number, body: RegionSupportRequest) {
  return apiPut<unknown>(`/salary/support/${id}`, body)
}

export function deleteRegionSupport(id: number) {
  return apiDelete<unknown>(`/salary/support/${id}`)
}

export function listSalaryRoles() {
  return apiGet<PagedResult<SalaryRole>>("/salary/support/roles")
}
