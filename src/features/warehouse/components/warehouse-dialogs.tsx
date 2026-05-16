
import { CreateWarehouseDialog } from "./create-warehouse-dialog"
import { UpdateWarehouseDialog } from "./update-warehouse-dialog"
import { useWarehouses } from "./warehouses-provider"

export function WarehouseDialogs() {
    const { open, currentRow, close } = useWarehouses()

    return (
        <>
            <CreateWarehouseDialog open={open === "create"} onOpenChange={(o) => !o && close()} />
            {currentRow && (
                <UpdateWarehouseDialog
                    warehouse={currentRow}
                    open={open === "edit"}
                    onOpenChange={(o) => !o && close()}
                />
            )}
        </>
    )
}
