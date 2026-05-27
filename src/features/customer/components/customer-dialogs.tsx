import { CreateCustomerDialog } from "./create-customer-dialog"
import { CustomerAliasDialog } from "./customer-alias-dialog"
import { UpdateCustomerDialog } from "./update-customer-dialog"
import { useCustomers } from "./customers-provider"

export function CustomerDialogs() {
    const { open, currentRow, close } = useCustomers()

    return (
        <>
            <CreateCustomerDialog
                open={open === "create"}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) close()
                }}
            />

            {currentRow && (
                <UpdateCustomerDialog
                    customer={currentRow}
                    open={open === "edit"}
                    onOpenChange={(nextOpen) => {
                        if (!nextOpen) close()
                    }}
                />
            )}

            {currentRow && (
                <CustomerAliasDialog
                    customer={currentRow}
                    open={open === "detail"}
                    onOpenChange={(nextOpen) => {
                        if (!nextOpen) close()
                    }}
                />
            )}
        </>
    )
}
