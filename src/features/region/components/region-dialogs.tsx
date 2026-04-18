import { CreateRegionDialog } from "./create-region-dialog"
import { UpdateRegionDialog } from "./update-region-dialog"
import { useRegions } from "./regions-provider"

export function RegionDialogs() {
    const { open, currentRow, close } = useRegions()

    return (
        <>
            <CreateRegionDialog
                open={open === "create"}
                onOpenChange={(o) => !o && close()}
            />

            {currentRow && (
                <UpdateRegionDialog
                    region={currentRow}
                    open={open === "edit"}
                    onOpenChange={(o: any) => !o && close()}
                />
            )}
        </>
    )
}