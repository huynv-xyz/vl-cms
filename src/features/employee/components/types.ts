export type EmployeeFormValues = {
    code: string
    name: string
    birth_date?: string
    permanent_address?: string
    identity_no?: string
    identity_issue_date?: string
    identity_issue_place?: string
    tax_code?: string
    labor_type?: string
    dependent_count?: number
    insurance_base?: number
    personal_insurance_from?: string
    personal_insurance_to?: string
    personal_bhxh?: 0 | 1
    personal_bhyt?: 0 | 1
    personal_bhtn?: 0 | 1
    personal_kpcd?: 0 | 1
    basic_salary?: number
    allowance_salary?: number
    is_union_member?: 0 | 1
    joined_at?: string
    left_at?: string
    status?: 0 | 1
}
