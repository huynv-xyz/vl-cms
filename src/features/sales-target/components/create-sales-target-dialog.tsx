import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import {
    createSalesTarget,
    type CreateSalesTargetRequest,
} from "@/api/sales-target"
import {
    salesTargetSchema,
    salesTargetUiSchema,
} from "./sales-target-form-schema"
import type { SalesTargetFormValues } from "./types"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateSalesTargetDialog({
    open,
    onOpenChange,
}: Props) {
    return (
        <CrudFormDialog<
            SalesTargetFormValues,
            CreateSalesTargetRequest,
            unknown
        >
            title="Tạo chỉ tiêu"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={salesTargetSchema}
            uiSchema={salesTargetUiSchema}
            defaultValues={{
                employeeId: undefined,
                period: undefined,
                main: 0,
                bonGoc: 0,
                bonLaBot: 0,
                clcn: 0,
                bonLaLong: 0,
            }}
            submitText="Tạo"
            loadingText="Đang tạo..."
            queryKeyToInvalidate={["sales-target"]}
            mutationFn={createSalesTarget}
            mapFormToRequest={(values) => ({
                employee_id: values.employeeId,
                period: values.period,
                main: values.main ?? 0,
                bon_goc: values.bonGoc ?? 0,
                bon_la_bot: values.bonLaBot ?? 0,
                clcn: values.clcn ?? 0,
                bon_la_long: values.bonLaLong ?? 0,
            })}
        />
    )
}