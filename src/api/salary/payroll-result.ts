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

export type PayrollScopeDetail = {
  role_code?: string
  region_code?: string
  province_code?: string
  income_amount: number
  salary_portion: number
  bonus_portion: number
  role_salary_amount: number
  role_bonus_amount: number
  base_salary: number
  allowance_amount: number
  gross_amount: number
  final_base_salary: number
  final_allowance: number
  support_amount: number
  final_gross: number
}

export type PayrollAdjustmentDetail = {
  region_code?: string
  luong_cb_dieu_chinh?: number | null
  phu_cap_dieu_chinh?: number | null
  ho_tro?: number | null
  ghi_chu?: string
}

export type PayrollMonthlyItemDetail = {
  item_type: "INCOME" | "DEDUCTION"
  amount: number
  note?: string
}

export type PayrollInsuranceRateDetail = {
  insurance_type: string
  employee_rate: number
  company_rate: number
}

export type PayrollTaxBracketDetail = {
  bracket_no: number
  income_from: number
  income_to?: number | null
  tax_rate: number
}

export type PayrollTaxExemptionDetail = {
  exempt_code: string
  description?: string
  amount_per_month: number
}

export type PayrollPerformanceDetail = {
  target_bon_goc: number
  target_bon_la_bot: number
  target_clcn: number
  target_bon_la_long: number
  target_gtqd_year: number
  target_gtqd_month: number
  actual_bon_goc: number
  actual_bon_la_bot: number
  actual_clcn: number
  actual_bon_la_long: number
  actual_gtqd_month: number
  completion_rate: number
  debt_rate: number
  source_transaction_count: number
  actual_row_count: number
  target_row_count: number
}

export type PayrollAnnualBonusDetail = {
  role_code?: string
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

export type PayrollBudgetDetail = {
  role_code?: string
  region_code?: string
  province_code?: string
  total_budget: number
  budget_80: number
  budget_20: number
  has_asm: number
}

export type PayrollDetailResult = {
  payroll: PayrollResultItem & {
    period: string
    employee_labor_type?: string
    employee_base_salary: number
    employee_allowance_salary: number
    employee_insurance_base: number
    employee_dependent_count: number
  }
  scopes: PayrollScopeDetail[]
  adjustments: PayrollAdjustmentDetail[]
  monthly_items: PayrollMonthlyItemDetail[]
  insurance_rates: PayrollInsuranceRateDetail[]
  tax_brackets: PayrollTaxBracketDetail[]
  tax_exemptions: PayrollTaxExemptionDetail[]
  performance: PayrollPerformanceDetail
  annual_bonus: PayrollAnnualBonusDetail[]
  budgets: PayrollBudgetDetail[]
}

export function getPayrollResultDetail(period: string, employeeId: number) {
  return apiGet<PayrollDetailResult>("/salary/payrolls/detail", { period, employeeId })
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
