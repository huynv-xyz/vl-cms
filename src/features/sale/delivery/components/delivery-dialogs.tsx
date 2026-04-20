import { CreateDeliveryDialog } from "./create-delivery-dialog"
import { useDeliveries } from "./deliverys-provider"
import { UpdateDeliveryDialog } from "./update-delivery-dialog"

export function DeliveryDialogs() {
    const { open, currentRow, close } = useDeliveries()

    return (
        <>
            <CreateDeliveryDialog
                open={open === "create"}
                onOpenChange={(o) => !o && close()}
            />

            {currentRow && (
                <UpdateDeliveryDialog
                    delivery={currentRow}
                    open={open === "edit"}
                    onOpenChange={(o) => !o && close()}
                />
            )}
        </>
    )
}