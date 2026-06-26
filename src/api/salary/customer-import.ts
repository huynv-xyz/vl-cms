import { apiPostMultipart } from "@/api/client"

export type SalaryCustomerImportSync = {
  period: string
  source_rows: number
  missing_employees: number
  deleted: number
  inserted: number
}

export type SalaryCustomerImportResult = {
  message: string
  file_name: string
  file_path: string
  year: number
  adjustment_period: string
  replace_existing: boolean
  employees: number
  products: number
  region_income_configs: number
  role_rates: number
  bonus_split_rules: number
  insurance_configs: number
  tax_brackets: number
  tax_exemptions: number
  employee_scopes: number
  sales_targets: number
  manager_mappings: number
  salary_adjustments: number
  monthly_items: number
  sales_transactions: number
  sales_actual_syncs: SalaryCustomerImportSync[]
}

export function importSalaryCustomerWorkbook(params: {
  file: File
  year: number
  adjustmentPeriod: string
  replaceExisting: boolean
}) {
  const formData = new FormData()
  formData.append("file", params.file)
  const query = new URLSearchParams({
    year: String(params.year),
    adjustmentPeriod: params.adjustmentPeriod,
    replaceExisting: String(params.replaceExisting),
  })

  return apiPostMultipart<SalaryCustomerImportResult>(
    `/salary/customer-import/workbook?${query.toString()}`,
    formData,
    {
      signal: AbortSignal.timeout(300_000),
    },
  ).then((result) => result)
}
