import { Row } from "@tanstack/react-table"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useEmployees } from "./employees-provider"
import type { Employee } from "../data/schema"

export function EmployeeRowActions({ row }: { row: Row<Employee> }) {
    const { openEdit } = useEmployees()

    return (
        <CrudRowActions onEdit={() => openEdit(row.original)} />
    )
}