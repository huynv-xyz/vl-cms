import { CreateInboundDialog } from "./create-inbound-dialog"
import { useInventoryInbounds } from "./inbounds-provider"
import { UpdateInboundDialog } from "./update-inbound-dialog"

export function InboundDialogs() {
    const { open, currentRow, close } = useInventoryInbounds()

    return (
        <>
            <CreateInboundDialog
                open={open === "create"}
                onOpenChange={(o) => !o && close()}
            />

            {currentRow && (
                <UpdateInboundDialog
                    inbound={currentRow}
                    open={open === "edit"}
                    onOpenChange={(o) => !o && close()}
                />
            )}
        </>
    )
}