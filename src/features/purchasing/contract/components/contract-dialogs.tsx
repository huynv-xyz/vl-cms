import { CreateContractDialog } from "./create-contract-dialog"
import { UpdateContractDialog } from "./update-contract-dialog"
import { useContracts } from "./contracts-provider"

export function ContractDialogs() {
    const { open, currentRow, close } = useContracts()

    return (
        <>
            <CreateContractDialog
                open={open === "create"}
                onOpenChange={(o) => !o && close()}
            />

            {currentRow && (
                <UpdateContractDialog
                    contract={currentRow}
                    open={open === "edit"}
                    onOpenChange={(o) => !o && close()}
                />
            )}
        </>
    )
}