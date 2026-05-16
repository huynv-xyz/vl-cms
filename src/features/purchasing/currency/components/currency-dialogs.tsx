import { CreateCurrencyDialog } from "./create-currency-dialog"
import { useCurrencies } from "./currencies-provider"
import { UpdateCurrencyDialog } from "./update-currency-dialog"

export function CurrencyDialogs() {
    const { open, currentRow, close } = useCurrencies()

    return (
        <>
            <CreateCurrencyDialog
                open={open === "create"}
                onOpenChange={(isOpen) => !isOpen && close()}
            />

            {currentRow && (
                <UpdateCurrencyDialog
                    currency={currentRow}
                    open={open === "edit"}
                    onOpenChange={(isOpen) => !isOpen && close()}
                />
            )}
        </>
    )
}
