import { apiGet, type PagedResult } from "@/api/client"

export type SalaryBudgetItem = {
  id: number
  period: string
  employee_id: number
  emp_code?: string | null
  emp_name?: string | null
  role_code: string
  region_code?: string | null
  province_code?: string | null
  total_budget: number
  budget_80: number
  budget_20: number
  has_asm: number
}

export type PayrollScopeItem = {
  id: number
  period: string
  employee_id: number
  emp_code?: string | null
  emp_name?: string | null
  role_code: string
  region_code?: string | null
  province_code?: string | null
  salary_portion: number
  bonus_portion: number
  role_salary_amount: number
  role_bonus_amount: number
  base_salary: number
  allowance_amount: number
  completion_rate: number
  debt_rate: number
  is_bonus_eligible: number
  support_amount: number
  final_base_salary: number
  final_allowance: number
  final_gross: number
}

export function listSalaryBudgets(params: { page: number; size: number; period: string; keyword?: string }) {
  return apiGet<PagedResult<SalaryBudgetItem>>("/salary/budgets", params)
}

export function listPayrollScopes(params: { page: number; size: number; period: string; keyword?: string }) {
  return apiGet<PagedResult<PayrollScopeItem>>("/salary/payroll-scopes", params)
}
