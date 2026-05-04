import { CreateReceiptDialog } from "./create-receipt-dialog"
import { UpdateReceiptDialog } from "./update-receipt-dialog"
import { useReceipts } from "./receipts-provider"

export function ReceiptDialogs() {
    const { open, currentRow, close } = useReceipts()

    return (
        <>
            <CreateReceiptDialog
                open={open === "create"}
                onOpenChange={(o) => !o && close()}
            />

            {currentRow && (
                <UpdateReceiptDialog
                    receipt={currentRow}
                    open={open === "edit"}
                    onOpenChange={(o) => !o && close()}
                />
            )}
        </>
    )
}