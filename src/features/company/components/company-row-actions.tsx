import { Row } from "@tanstack/react-table"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useCompanies } from "./companies-provider"
import type { Company } from "../data/schema"

export function CompanyRowActions({ row }: { row: Row<Company> }) {
    const { openEdit } = useCompanies()

    return <CrudRowActions row={row.original} onEdit={() => openEdit(row.original)} />
}
