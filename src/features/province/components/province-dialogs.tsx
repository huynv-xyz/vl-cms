
import { CreateProvinceDialog } from "./create-province-dialog"
import { UpdateProvinceDialog } from "./update-province-dialog"
import { useProvinces } from "./provinces-provider"

export function ProvinceDialogs() {
    const { open, currentRow, close } = useProvinces()

    return (
        <>
            <CreateProvinceDialog open={open === "create"} onOpenChange={(o) => !o && close()} />
            {currentRow && (
                <UpdateProvinceDialog
                    province={currentRow}
                    open={open === "edit"}
                    onOpenChange={(o) => !o && close()}
                />
            )}
        </>
    )
}
