import { CreateSalesTargetDialog } from "./create-sales-target-dialog"
import { UpdateSalesTargetDialog } from "./update-sales-target-dialog"
import { useSalesTargets } from "./sales-targets-provider"

export function SalesTargetDialogs() {
    const { open, currentRow, close } = useSalesTargets()

    return (
        <>
            <CreateSalesTargetDialog
                open={open === "create"}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) close()
                }}
            />

            {currentRow && (
                <UpdateSalesTargetDialog
                    salesTarget={currentRow}
                    open={open === "edit"}
                    onOpenChange={(nextOpen) => {
                        if (!nextOpen) close()
                    }}
                />
            )}
        </>
    )
}