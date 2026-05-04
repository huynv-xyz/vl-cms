import { CreateReturnDialog } from "./create-return-dialog"
import { UpdateReturnDialog } from "./update-return-dialog"
import { useReturns } from "./returns-provider"

export function ReturnDialogs() {

    const { open, currentRow, close } = useReturns()

    return (
        <>
            <CreateReturnDialog
                open={open === "create"}
                onOpenChange={(o) => !o && close()}
            />

            {currentRow && (
                <UpdateReturnDialog
                    returnData={currentRow}
                    open={open === "edit"}
                    onOpenChange={(o) => !o && close()}
                />
            )}
        </>
    )
}