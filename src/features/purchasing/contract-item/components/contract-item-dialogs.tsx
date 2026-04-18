import { CreateContractItemDialog } from "./create-contract-item-dialog"
import { UpdateContractItemDialog } from "./update-contract-item-dialog"
import { useContractItems } from "./contract-items-provider"

type Props = {
    contractId: number
}

export function ContractItemDialogs({ contractId }: Props) {
    const { open, currentRow, close } = useContractItems()

    return (
        <>
            <CreateContractItemDialog
                contractId={contractId}
                open={open === "create"}
                onOpenChange={(o) => !o && close()}
            />

            {open === "edit" && currentRow && (
                <UpdateContractItemDialog
                    item={currentRow}
                    open
                    onOpenChange={(o) => !o && close()}
                />
            )}
        </>
    )
}