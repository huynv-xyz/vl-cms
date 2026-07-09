import { apiDelete, apiGet, apiPost, apiPut, type PagedResult } from "@/api/client"

export type ListResult<T> = {
  items: T[]
  total: number
}

export type InsuranceConfigItem = {
  id: number
  insurance_type: string
  labor_type: string
  employee_rate: number
  company_rate: number
}

export type TaxBracketItem = {
  id: number
  year: number
  bracket_no: number
  income_from: number
  income_to?: number | null
  tax_rate: number
}

export type EmployeeDeductionItem = {
  id: number
  period: string
  employee_id: number
  code: string
  name: string
  item_type: "INCOME" | "ADVANCE" | "DEDUCTION"
  amount: number
  note?: string | null
}

export type InsurancePayload = {
  insuranceType: string
  laborType: string
  employeeRate: number
  companyRate: number
}

export type TaxBracketPayload = {
  year: number
  bracketNo: number
  incomeFrom: number
  incomeTo?: number | null
  taxRate: number
}

export type EmployeeDeductionPayload = {
  period: string
  employeeId: number
  itemType: "INCOME" | "ADVANCE" | "DEDUCTION"
  amount: number
  note?: string | null
}

const base = "/salary/payroll-config"

export const payrollConfigApi = {
  listInsurance: () => apiGet<ListResult<InsuranceConfigItem>>(`${base}/insurance`),
  createInsurance: (body: InsurancePayload) => apiPost<unknown>(`${base}/insurance`, body),
  updateInsurance: (id: number, body: InsurancePayload) => apiPut<unknown>(`${base}/insurance/${id}`, body),
  deleteInsurance: (id: number) => apiDelete<unknown>(`${base}/insurance/${id}`),

  listTaxBrackets: (params?: { year?: number }) => apiGet<ListResult<TaxBracketItem>>(`${base}/tax-brackets`, params),
  createTaxBracket: (body: TaxBracketPayload) => apiPost<unknown>(`${base}/tax-brackets`, body),
  updateTaxBracket: (id: number, body: TaxBracketPayload) => apiPut<unknown>(`${base}/tax-brackets/${id}`, body),
  deleteTaxBracket: (id: number) => apiDelete<unknown>(`${base}/tax-brackets/${id}`),

  listMonthlyIncomes: (params: { page: number; size: number; period: string; keyword?: string }) =>
    apiGet<PagedResult<EmployeeDeductionItem>>(`${base}/monthly-incomes`, params),
  createMonthlyIncome: (body: EmployeeDeductionPayload) =>
    apiPost<unknown>(`${base}/monthly-incomes`, body),
  updateMonthlyIncome: (id: number, body: EmployeeDeductionPayload) =>
    apiPut<unknown>(`${base}/monthly-incomes/${id}`, body),
  deleteMonthlyIncome: (id: number) => apiDelete<unknown>(`${base}/monthly-incomes/${id}`),
}
