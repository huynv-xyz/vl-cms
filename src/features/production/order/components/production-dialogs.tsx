import { CreateProductionDialog } from "./create-production-dialog"
import { useProductions } from "./productions-provider"
import { UpdateProductionDialog } from "./update-production-dialog"

export function ProductionDialogs() {
    const { open, currentRow, close } = useProductions()

    return (
        <>
            {open === "create" && (
                <CreateProductionDialog
                    open
                    onOpenChange={(o) => !o && close()}
                />
            )}

            {currentRow && (
                <UpdateProductionDialog
                    production={currentRow}
                    open={open === "edit"}
                    onOpenChange={(o) => !o && close()}
                />
            )}
        </>
    )
}