import { apiDelete, apiGet, apiPost, apiPut, type PagedResult } from "@/api/client"

export type EmployeeScopeItem = {
  id: number
  employee_id: number
  role_id: number
  region_id?: number | null
  province_id?: number | null
  is_personal_target?: number
  is_manager_target?: number
  effective_from: string
  effective_to?: string | null
  status?: number
}

export type EmployeeScopeRequest = {
  employee_id: number
  role_id: number
  region_id?: number | null
  province_id?: number | null
  is_personal_target?: number
  is_manager_target?: number
  effective_from: string
  effective_to?: string | null
  status?: number
}

export type ManagerMappingItem = {
  id: number
  period: string
  sales_employee_id: number
  asm_employee_id?: number | null
  rm_employee_id?: number | null
  region_id?: number | null
  province_id?: number | null
}

export type ManagerMappingRequest = {
  period: number
  sales_employee_id: number
  asm_employee_id?: number | null
  rm_employee_id?: number | null
  region_id?: number | null
  province_id?: number | null
}

export type EmployeeScopeListParams = {
  page?: number
  size?: number
  period?: number | string
  employee_id?: number | string
  role_id?: number | string
  region_id?: number | string
  province_id?: number | string
  status?: number | string
}

export function listEmployeeScopes(params: EmployeeScopeListParams = {}) {
  return apiGet<PagedResult<EmployeeScopeItem>>("/employee-scopes", { page: 1, size: 500, ...params })
}

export function createEmployeeScope(body: EmployeeScopeRequest) {
  return apiPost<unknown>("/employee-scopes", body)
}

export function updateEmployeeScope(id: number, body: EmployeeScopeRequest) {
  return apiPut<unknown>(`/employee-scopes/${id}`, body)
}

export function deleteEmployeeScope(id: number) {
  return apiDelete<unknown>(`/employee-scopes/${id}`)
}

export function listManagerMappings() {
  return apiGet<PagedResult<ManagerMappingItem>>("/salary-sale/manager-mappings", { page: 1, size: 500 })
}

export function createManagerMapping(body: ManagerMappingRequest) {
  return apiPost<unknown>("/salary-sale/manager-mappings", body)
}

export function updateManagerMapping(id: number, body: ManagerMappingRequest) {
  return apiPut<unknown>(`/salary-sale/manager-mappings/${id}`, body)
}

export function deleteManagerMapping(id: number) {
  return apiDelete<unknown>(`/salary-sale/manager-mappings/${id}`)
}
