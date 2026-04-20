import { CreateOrderDialog } from "./create-order-dialog"
import { UpdateOrderDialog } from "./update-order-dialog"
import { useOrders } from "./orders-provider"

export function OrderDialogs() {
    const { open, currentRow, close } = useOrders()

    return (
        <>
            <CreateOrderDialog
                open={open === "create"}
                onOpenChange={(o) => !o && close()}
            />

            {currentRow && (
                <UpdateOrderDialog
                    order={currentRow}
                    open={open === "edit"}
                    onOpenChange={(o) => !o && close()}
                />
            )}
        </>
    )
}