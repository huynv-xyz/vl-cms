import { CreateCustomerDialog } from "./create-customer-dialog"
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
        </>
    )
}