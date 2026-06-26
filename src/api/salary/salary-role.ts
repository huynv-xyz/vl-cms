import { apiDelete, apiGet, apiPost, apiPut, type PagedResult } from "@/api/client"

export type SalaryRoleItem = {
  id: number
  code: string
  name: string
  type?: string
  description?: string | null
  status?: number
}

export type SalaryRoleRequest = {
  code: string
  name: string
  type?: string
  description?: string | null
  status?: number
}

export type RoleRateItem = {
  id: number
  role_id: number
  salary_rate: number
  bonus_rate: number
  basic_salary_rate: number
  allowance_rate: number
  effective_from: string
  effective_to?: string | null
  status?: number
}

export type RoleRateRequest = {
  role_id: number
  salary_rate: number
  bonus_rate: number
  basic_salary_rate: number
  allowance_rate: number
  effective_from: string
  effective_to?: string | null
  status?: number
}

export function listSalaryRoles(params: { page?: number; size?: number; keyword?: string; status?: string | number } = {}) {
  return apiGet<PagedResult<SalaryRoleItem>>("/salary/roles", { page: 1, size: 200, ...params })
}

export function createSalaryRole(body: SalaryRoleRequest) {
  return apiPost<unknown>("/salary/roles", body)
}

export function updateSalaryRole(id: number, body: SalaryRoleRequest) {
  return apiPut<unknown>(`/salary/roles/${id}`, body)
}

export function deleteSalaryRole(id: number) {
  return apiDelete<unknown>(`/salary/roles/${id}`)
}

export function listRoleRates(params: { page?: number; size?: number; role_id?: number; status?: string | number } = {}) {
  return apiGet<PagedResult<RoleRateItem>>("/salary-sale/role-rates", { page: 1, size: 500, ...params })
}

export function createRoleRate(body: RoleRateRequest) {
  return apiPost<unknown>("/salary-sale/role-rates", body)
}

export function updateRoleRate(id: number, body: RoleRateRequest) {
  return apiPut<unknown>(`/salary-sale/role-rates/${id}`, body)
}

export function deleteRoleRate(id: number) {
  return apiDelete<unknown>(`/salary-sale/role-rates/${id}`)
}
