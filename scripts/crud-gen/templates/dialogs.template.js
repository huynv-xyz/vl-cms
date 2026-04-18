export function dialogsTemplate({ Entity }) {
    return `
import { Create${Entity}Dialog } from "./create-${Entity.toLowerCase()}-dialog"
import { Update${Entity}Dialog } from "./update-${Entity.toLowerCase()}-dialog"
import { use${Entity}s } from "./${Entity.toLowerCase()}s-provider"

export function ${Entity}Dialogs() {
    const { open, currentRow, close } = use${Entity}s()

    return (
        <>
            <Create${Entity}Dialog open={open === "create"} onOpenChange={(o) => !o && close()} />
            {currentRow && (
                <Update${Entity}Dialog
                    ${Entity.toLowerCase()}={currentRow}
                    open={open === "edit"}
                    onOpenChange={(o) => !o && close()}
                />
            )}
        </>
    )
}
`
}