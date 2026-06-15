import { CreatePhysicalWarehouseDialog } from "./create-physical-warehouse-dialog"
import { UpdatePhysicalWarehouseDialog } from "./update-physical-warehouse-dialog"
import { usePhysicalWarehouses } from "./physical-warehouses-provider"

export function PhysicalWarehouseDialogs() {
    const { open, currentRow, close } = usePhysicalWarehouses()

    return (
        <>
            <CreatePhysicalWarehouseDialog
                open={open === "create"}
                onOpenChange={(o: boolean) => !o && close()}
            />
            {currentRow && (
                <UpdatePhysicalWarehouseDialog
                    physicalWarehouse={currentRow}
                    open={open === "edit"}
                    onOpenChange={(o) => !o && close()}
                />
            )}
        </>
    )
}
