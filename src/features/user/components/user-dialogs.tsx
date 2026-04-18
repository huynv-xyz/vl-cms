import { CreateUserDialog } from "./create-user-dialog"
import { UpdateUserDialog } from "./update-user-dialog"
import { useUsers } from "./users-provider"

export function UserDialogs() {
    const { open, currentRow, close } = useUsers()

    return (
        <>
            <CreateUserDialog
                open={open === "create"}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) close()
                }}
            />

            {currentRow && (
                <UpdateUserDialog
                    user={currentRow}
                    open={open === "edit"}
                    onOpenChange={(nextOpen) => {
                        if (!nextOpen) close()
                    }}
                />
            )}
        </>
    )
}