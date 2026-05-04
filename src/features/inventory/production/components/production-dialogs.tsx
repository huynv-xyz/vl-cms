import { CreateProductionDialog } from "./create-production-dialog"
import { UpdateProductionDialog } from "./update-production-dialog"
import { useProductions } from "./productions-provider"

export function ProductionDialogs() {
    const { open, currentRow, close } = useProductions()

    return (
        <>
            <CreateProductionDialog
                open={open === "create"}
                onOpenChange={(o: boolean) => !o && close()}
            />

            {currentRow && (
                <UpdateProductionDialog
                    production={currentRow}
                    open={open === "edit"}
                    onOpenChange={(o: boolean) => !o && close()}
                />
            )}
        </>
    )
}