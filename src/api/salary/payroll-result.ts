import { apiGet } from "@/api/client"
import type { PagedResult } from "@/api/client"

export type PayrollResultItem = {
  employee_id: number
  emp_code?: string
  emp_name?: string
  role_code?: string
  region_code?: string
  total_base_salary: number
  total_allowance: number
  total_bonus: number
  support_amount: number
  gross_total: number
  luong_dong_bh: number
  bhxh_nv: number
  bhyt_nv: number
  bhtn_nv: number
  kpcd_nv: number
  social_insurance: number
  tax_exempt_amount: number
  taxable_income: number
  labor_type: string
  dependent_count: number
  personal_income_tax: number
  tam_ung: number
  khau_tru_khac: number
  net_total: number
}

export type PayrollResultParams = {
  page: number
  size: number
  period: string
  keyword?: string
}

export function listPayrollResults(params: PayrollResultParams) {
  return apiGet<PagedResult<PayrollResultItem>>("/salary/payrolls", params)
}

export type YearBonusItem = {
  employee_id: number
  emp_code?: string
  emp_name?: string
  role_code: string
  region_code?: string
  has_asm: number
  gtqd_dk: number
  actual_pct_over: number
  applied_tier_rate: number
  pool_at_tier: number
  bonus_sale: number
  bonus_asm: number
  bonus_rm: number
  amount: number
}

export type YearBonusListResult = {
  items: YearBonusItem[]
  total: number
}

export function listYearBonus(year: number) {
  return apiGet<YearBonusListResult>(`/salary/bonus-year/${year}`)
}
