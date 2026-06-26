import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import { CrudTable } from "@/components/crud/crud-table"
import { buildPayrollResultColumns } from "./payroll-result-columns"
import type { PayrollResultItem } from "../data/schema"

type Props = {
  data: PayrollResultItem[]
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
  pageCount: number
  keyword: string
  onKeywordChange: (k: string) => void
  period: string
}

export function PayrollResultTable({
  data, pagination, onPaginationChange, pageCount, keyword, onKeywordChange, period,
}: Props) {
  return (
    <CrudTable<PayrollResultItem>
      data={data}
      columns={buildPayrollResultColumns(period)}
      entityName="nhân viên"
      searchPlaceholder="Tìm theo tên hoặc mã nhân viên..."
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      pageCount={pageCount}
      keyword={keyword}
      onKeywordChange={onKeywordChange}
    />
  )
}
