import { CrudTable } from "@/components/crud/crud-table"
import type { Employee } from "../data/schema"
import { employeeColumns } from "./employee-columns"

export function EmployeeTable(props: any) {
    return (
        <CrudTable<Employee>
            {...props}
            columns={employeeColumns}
            entityName="nhân viên"
            searchPlaceholder="Tìm theo code hoặc tên..."
        />
    )
}