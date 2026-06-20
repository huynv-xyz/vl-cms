import { apiGet } from "@/api/client"

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

export function getRegionPool(period: string) {
  return apiGet<RegionPoolResult>(`/salary/region-pool/${period}`)
}
