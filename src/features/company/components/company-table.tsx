import { CrudTable } from "@/components/crud/crud-table"
import type { Company } from "../data/schema"
import { companyColumns } from "./company-columns"

export function CompanyTable(props: any) {
    return (
        <CrudTable<Company>
            {...props}
            columns={companyColumns}
            entityName="công ty"
            searchPlaceholder="Tìm theo tên công ty..."
        />
    )
}
