import { apiGet, apiPost } from "@/api/client"

export type PipelineResult = {
  period: string
  success: boolean
  step1_done: boolean
  step2_done: boolean
  step2_count: number
  step3_done: boolean
  step3_count: number
  step4_done: boolean
  step4_count: number
  step5_done: boolean
  step5_count: number
  error?: string
}

export type YearBonusResult = {
  year: number
  sales_processed: number
  message: string
}

export function runPayroll(period: string) {
  return apiPost<PipelineResult>(`/salary/run/${period}`)
}

export function runYearBonus(year: number) {
  return apiPost<YearBonusResult>(`/salary/bonus-year/run/${year}`)
}
