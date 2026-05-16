import { BomDetailDialog } from "./bom-detail-dialog"
import { CreateBomDialog } from "./create-bom-dialog"
import { useProductBoms } from "./boms-provider"

export function ProductBomDialogs() {
    const { open, currentRow, close } = useProductBoms()

    return (
        <>
            <CreateBomDialog
                open={open === "create"}
                onOpenChange={(o) => !o && close()}
            />

            {currentRow && (
                <CreateBomDialog
                    bom={currentRow}
                    open={open === "edit"}
                    onOpenChange={(o) => !o && close()}
                />
            )}

            {currentRow && (
                <BomDetailDialog
                    bom={currentRow}
                    open={open === "detail"}
                    onOpenChange={(o) => !o && close()}
                />
            )}
        </>
    )
}
