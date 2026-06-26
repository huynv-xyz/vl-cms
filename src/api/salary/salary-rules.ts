import { apiDelete, apiGet, apiPost, apiPut, type PagedResult } from "@/api/client"
import type { RegionSupportItem, RegionSupportRequest } from "@/api/salary/region-pool"

export type ListResult<T> = {
  items: T[]
  total: number
}

export type BonusSplitRuleItem = {
  id: number
  code: string
  has_asm: number
  sales_rate: number
  asm_rate: number
  rm_rate: number
  effective_from: string
  effective_to?: string | null
  status?: number
  description?: string | null
}

export type ProgressiveBonusTierItem = {
  id: number
  code: string
  from_rate: number
  to_rate?: number | null
  bonus_rate: number
  effective_from: string
  effective_to?: string | null
  status?: number
  sort_order?: number
  description?: string | null
}

export type SystemConfigItem = {
  id: number
  config_key: string
  config_value: number
  description?: string | null
  effective_from: string
  effective_to?: string | null
  status?: number
}

export type BonusSplitRulePayload = {
  code: string
  hasAsm: number
  salesRate: number
  asmRate: number
  rmRate: number
  effectiveFrom: string
  effectiveTo?: string | null
  status?: number
  description?: string | null
}

export type ProgressiveBonusTierPayload = {
  code: string
  fromRate: number
  toRate?: number | null
  bonusRate: number
  effectiveFrom: string
  effectiveTo?: string | null
  status?: number
  sortOrder?: number
  description?: string | null
}

export type SystemConfigPayload = {
  configKey: string
  configValue: number
  effectiveFrom: string
  effectiveTo?: string | null
  status?: number
  description?: string | null
}

export function listRegionSupports(period: string) {
  return apiGet<ListResult<RegionSupportItem>>("/salary/support", { period })
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

export function listBonusSplitRules() {
  return apiGet<PagedResult<BonusSplitRuleItem>>("/salary-sale/bonus-split-rules", { page: 1, size: 200 })
}

export function createBonusSplitRule(body: BonusSplitRulePayload) {
  return apiPost<unknown>("/salary-sale/bonus-split-rules", body)
}

export function updateBonusSplitRule(id: number, body: BonusSplitRulePayload) {
  return apiPut<unknown>(`/salary-sale/bonus-split-rules/${id}`, body)
}

export function deleteBonusSplitRule(id: number) {
  return apiDelete<unknown>(`/salary-sale/bonus-split-rules/${id}`)
}

export function listProgressiveBonusTiers() {
  return apiGet<PagedResult<ProgressiveBonusTierItem>>("/salary-sale/progressive-bonus-tiers", { page: 1, size: 200 })
}

export function createProgressiveBonusTier(body: ProgressiveBonusTierPayload) {
  return apiPost<unknown>("/salary-sale/progressive-bonus-tiers", body)
}

export function updateProgressiveBonusTier(id: number, body: ProgressiveBonusTierPayload) {
  return apiPut<unknown>(`/salary-sale/progressive-bonus-tiers/${id}`, body)
}

export function deleteProgressiveBonusTier(id: number) {
  return apiDelete<unknown>(`/salary-sale/progressive-bonus-tiers/${id}`)
}

export function listSystemConfigs() {
  return apiGet<ListResult<SystemConfigItem>>("/salary/payroll-config/system-configs")
}

export function createSystemConfig(body: SystemConfigPayload) {
  return apiPost<unknown>("/salary/payroll-config/system-configs", body)
}

export function updateSystemConfig(id: number, body: SystemConfigPayload) {
  return apiPut<unknown>(`/salary/payroll-config/system-configs/${id}`, body)
}

export function deleteSystemConfig(id: number) {
  return apiDelete<unknown>(`/salary/payroll-config/system-configs/${id}`)
}
