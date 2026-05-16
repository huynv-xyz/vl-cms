import { CrudTable } from "@/components/crud/crud-table"
import { currencyColumns } from "./currency-columns"

export function CurrencyTable(props: any) {
    return (
        <CrudTable
            {...props}
            columns={currencyColumns}
            entityName="tiền tệ"
            searchPlaceholder="Tìm theo mã hoặc tên tiền tệ..."
        />
    )
}
