import { CreateEmployeeDialog } from "./create-employee-dialog"
import { UpdateEmployeeDialog } from "./update-employee-dialog"
import { useEmployees } from "./employees-provider"

export function EmployeeDialogs() {
    const { open, currentRow, close } = useEmployees()

    return (
        <>
            <CreateEmployeeDialog
                open={open === "create"}
                onOpenChange={(o) => !o && close()}
            />

            {currentRow && (
                <UpdateEmployeeDialog
                    employee={currentRow}
                    open={open === "edit"}
                    onOpenChange={(o) => !o && close()}
                />
            )}
        </>
    )
}