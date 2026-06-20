import { apiDelete, apiGet, apiPost, apiPut } from "@/api/client"

export type SalaryAdjustmentItem = {
  id: number
  period: string
  employee_id: number
  emp_code: string
  emp_name: string
  region_code?: string
  luong_cb_dieu_chinh?: number | null
  phu_cap_dieu_chinh?: number | null
  ho_tro?: number | null
  ghi_chu?: string
  status: number
}

export type CreateAdjustmentRequest = {
  period: string
  employee_id: number
  region_code?: string
  luong_cb_dieu_chinh?: number | null
  phu_cap_dieu_chinh?: number | null
  ho_tro?: number | null
  ghi_chu?: string
}

export type ListAdjustmentResult = {
  items: SalaryAdjustmentItem[]
  total: number
}

export function listAdjustments(period: string) {
  return apiGet<ListAdjustmentResult>("/salary/adjustments", { period })
}

export function createAdjustment(body: CreateAdjustmentRequest) {
  return apiPost<unknown>("/salary/adjustments", body)
}

export function updateAdjustment(id: number, body: Partial<CreateAdjustmentRequest>) {
  return apiPut<unknown>(`/salary/adjustments/${id}`, body)
}

export function deleteAdjustment(id: number) {
  return apiDelete<unknown>(`/salary/adjustments/${id}`)
}
