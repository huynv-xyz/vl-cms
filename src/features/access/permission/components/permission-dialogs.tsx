import { CreatePermissionDialog } from "./create-permission-dialog"
import { UpdatePermissionDialog } from "./update-permission-dialog"
import { useAccessPermissions } from "./permissions-provider"

export function PermissionDialogs() {
    const { open, currentRow, close } = useAccessPermissions()

    return (
        <>
            <CreatePermissionDialog
                open={open === "create"}
                onOpenChange={(next) => {
                    if (!next) close()
                }}
            />

            {currentRow && (
                <UpdatePermissionDialog
                    permission={currentRow}
                    open={open === "edit"}
                    onOpenChange={(next) => {
                        if (!next) close()
                    }}
                />
            )}
        </>
    )
}
