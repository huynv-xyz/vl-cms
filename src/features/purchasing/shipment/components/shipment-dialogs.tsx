import { CreateShipmentDialog } from "./create-shipment-dialog"
import { UpdateShipmentDialog } from "./update-shipment-dialog"
import { useShipments } from "./shipments-provider"
import { Contract } from "../../contract/data/schema"

export function ShipmentDialogs({ contract }: { contract: Contract }) {
    const { open, currentRow, close, isFetching } = useShipments()

    return (
        <>
            <CreateShipmentDialog
                contractId={contract.id}
                contract={contract}
                open={open === "create"}
                onOpenChange={(o) => !o && close()}
            />

            {open === "edit" && currentRow && (
                <UpdateShipmentDialog
                    shipment={currentRow}
                    open
                    onOpenChange={(o) => !o && close()}
                />
            )}

            {open === "edit" && isFetching && (
                <div className="p-4 text-sm text-muted-foreground">
                    Đang tải dữ liệu...
                </div>
            )}
        </>
    )
}