import { CreateCompanyDialog } from "./create-company-dialog"
import { UpdateCompanyDialog } from "./update-company-dialog"
import { useCompanies } from "./companies-provider"

export function CompanyDialogs() {
    const { open, currentRow, close } = useCompanies()

    return (
        <>
            <CreateCompanyDialog
                open={open === "create"}
                onOpenChange={(o) => !o && close()}
            />

            {currentRow && (
                <UpdateCompanyDialog
                    company={currentRow}
                    open={open === "edit"}
                    onOpenChange={(o: any) => !o && close()}
                />
            )}
        </>
    )
}
