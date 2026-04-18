import { CrudTable } from "@/components/crud/crud-table"
import { contractItemColumns } from "./contract-item-columns"
import { ContractItem } from "../data/schema"

export function ContractItemTable(props: any) {
    return (
        <CrudTable<ContractItem>
            {...props}
            columns={contractItemColumns}
            entityName="hàng hóa"
            searchPlaceholder="Tìm theo tên hàng..."
        />
    )
}