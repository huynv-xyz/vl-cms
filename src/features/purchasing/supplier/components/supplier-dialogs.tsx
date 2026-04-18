import { CreateSupplierDialog } from "./create-supplier-dialog"
import { UpdateSupplierDialog } from "./update-supplier-dialog"
import { useSuppliers } from "./suppliers-provider"

export function SupplierDialogs() {
    const { open, currentRow, close } = useSuppliers()

    return (
        <>
            <CreateSupplierDialog
                open={open === "create"}
                onOpenChange={(o: any) => !o && close()}
            />

            {currentRow && (
                <UpdateSupplierDialog
                    supplier={currentRow}
                    open={open === "edit"}
                    onOpenChange={(o: any) => !o && close()}
                />
            )}
        </>
    )
}