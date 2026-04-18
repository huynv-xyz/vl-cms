import { CreatePortDialog } from "./create-port-dialog"
import { usePorts } from "./ports-provider"
import { UpdatePortDialog } from "./update-port-dialog"

export function PortDialogs() {
    const { open, currentRow, close } = usePorts()

    return (
        <>
            <CreatePortDialog
                open={open === "create"}
                onOpenChange={(o) => !o && close()}
            />

            {currentRow && (
                <UpdatePortDialog
                    port={currentRow}
                    open={open === "edit"}
                    onOpenChange={(o) => !o && close()}
                />
            )}
        </>
    )
}