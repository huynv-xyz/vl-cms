import { CrudTable } from "@/components/crud/crud-table"
import { paymentColumns } from "./payment-columns"
import { Payment } from "../data/schema"

export function PaymentTable(props: any) {
    return (
        <CrudTable<Payment>
            {...props}
            columns={paymentColumns}
            entityName="thanh toán"
            searchPlaceholder="Tìm theo mã hàng hoặc ghi chú..."
        />
    )
}