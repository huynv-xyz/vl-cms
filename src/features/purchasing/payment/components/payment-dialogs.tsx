import { CreatePaymentDialog } from "./create-payment-dialog"
import { UpdatePaymentDialog } from "./update-payment-dialog"
import { usePayments } from "./payment-provider"
import { Contract } from "../../contract/data/schema"

type Props = {
    contract: Contract
}

export function PaymentDialogs({ contract }: Props) {
    const { open, currentRow, close } = usePayments()

    return (
        <>
            <CreatePaymentDialog
                contract={contract}
                open={open === "create"}
                onOpenChange={(o) => !o && close()}
            />

            {currentRow && (
                <UpdatePaymentDialog
                    payment={currentRow}
                    open={open === "edit"}
                    onOpenChange={(o) => !o && close()}
                />
            )}
        </>
    )
}