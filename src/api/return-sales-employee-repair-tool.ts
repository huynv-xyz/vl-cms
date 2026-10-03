import { apiPost } from "@/api/client"

export type ReturnSalesEmployeeRepairRow = {
    id: number
    document_no: string
    return_id: number
    return_type?: string | null
    customer_code?: string | null
    customer_name?: string | null
    product_code?: string | null
    product_name?: string | null
    sale_user_code?: string | null
    sale_user_name?: string | null
    target_employee_id?: number | null
    target_employee_code?: string | null
    target_employee_name?: string | null
    source: string
    reason?: string | null
}

export type ReturnSalesEmployeeRepairResult = {
    applied: boolean
    total_missing: number
    mappable: number
    unmappable: number
    returns_updated: number
    transactions_updated: number
    rows: ReturnSalesEmployeeRepairRow[]
    unresolved_rows: ReturnSalesEmployeeRepairRow[]
}

function numberValue(value: unknown): number {
    const parsed = Number(value ?? 0)
    return Number.isFinite(parsed) ? parsed : 0
}

function normalizeRow(raw: any): ReturnSalesEmployeeRepairRow {
    return {
        id: numberValue(raw?.id),
        document_no: raw?.document_no ?? raw?.documentNo ?? "",
        return_id: numberValue(raw?.return_id ?? raw?.returnId),
        return_type: raw?.return_type ?? raw?.returnType,
        customer_code: raw?.customer_code ?? raw?.customerCode,
        customer_name: raw?.customer_name ?? raw?.customerName,
        product_code: raw?.product_code ?? raw?.productCode,
        product_name: raw?.product_name ?? raw?.productName,
        sale_user_code: raw?.sale_user_code ?? raw?.saleUserCode,
        sale_user_name: raw?.sale_user_name ?? raw?.saleUserName,
        target_employee_id: raw?.target_employee_id ?? raw?.targetEmployeeId,
        target_employee_code: raw?.target_employee_code ?? raw?.targetEmployeeCode,
        target_employee_name: raw?.target_employee_name ?? raw?.targetEmployeeName,
        source: raw?.source ?? "",
        reason: raw?.reason,
    }
}

function normalizeResult(raw: any): ReturnSalesEmployeeRepairResult {
    if (!raw || typeof raw !== "object") {
        throw new Error("Backend trả về dữ liệu kiểm tra không hợp lệ")
    }

    const unresolvedRows = raw.unresolved_rows ?? raw.unresolvedRows
    if (!Array.isArray(unresolvedRows)) {
        throw new Error("Backend chưa hỗ trợ danh sách cần xử lý riêng. Vui lòng cập nhật hoặc khởi động lại backend")
    }

    return {
        applied: Boolean(raw.applied),
        total_missing: numberValue(raw.total_missing ?? raw.totalMissing),
        mappable: numberValue(raw.mappable),
        unmappable: numberValue(raw.unmappable),
        returns_updated: numberValue(raw.returns_updated ?? raw.returnsUpdated),
        transactions_updated: numberValue(raw.transactions_updated ?? raw.transactionsUpdated),
        rows: Array.isArray(raw.rows) ? raw.rows.map(normalizeRow) : [],
        unresolved_rows: unresolvedRows.map(normalizeRow),
    }
}

export function checkReturnSalesEmployeeRepair() {
    return apiPost<any>("/tools/return-sales-employee-repair/check", {}).then(normalizeResult)
}

export function applyReturnSalesEmployeeRepair() {
    return apiPost<any>("/tools/return-sales-employee-repair/apply", {}).then(normalizeResult)
}

export function loadUnresolvedReturnSalesEmployees(offset: number) {
    return apiPost<any>("/tools/return-sales-employee-repair/unresolved", { offset }).then((raw) => {
        if (!Array.isArray(raw)) throw new Error("Backend trả về danh sách cần xử lý không hợp lệ")
        return raw.map(normalizeRow)
    })
}
