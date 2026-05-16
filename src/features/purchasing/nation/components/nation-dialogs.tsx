import { CreateNationDialog } from "./create-nation-dialog"
import { useNations } from "./nations-provider"
import { UpdateNationDialog } from "./update-nation-dialog"

export function NationDialogs() {
    const { open, currentRow, close } = useNations()

    return (
        <>
            <CreateNationDialog
                open={open === "create"}
                onOpenChange={(isOpen) => !isOpen && close()}
            />

            {currentRow && (
                <UpdateNationDialog
                    nation={currentRow}
                    open={open === "edit"}
                    onOpenChange={(isOpen) => !isOpen && close()}
                />
            )}
        </>
    )
}
