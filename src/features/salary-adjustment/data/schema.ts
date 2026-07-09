export type SalaryAdjustmentItem = {
  id: number
  period: string
  employee_id: number
  emp_code: string
  emp_name: string
  region_code?: string
  region_name?: string
  luong_cb_dieu_chinh?: number | null
  phu_cap_dieu_chinh?: number | null
  ho_tro?: number | null
  ghi_chu?: string
  status: number
}
