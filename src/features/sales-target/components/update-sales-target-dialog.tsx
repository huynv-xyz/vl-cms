import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import {
    updateSalesTarget,
    type UpdateSalesTargetRequest,
} from "@/api/sales-target"
import type { SalesTarget } from "../data/schema"
import {
    salesTargetSchema,
    salesTargetUiSchema,
} from "./sales-target-form-schema"
import type { SalesTargetFormValues } from "./types"

type Props = {
    salesTarget: SalesTarget
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdateSalesTargetDialog({
    salesTarget,
    open,
    onOpenChange,
}: Props) {
    return (
        <CrudFormDialog<
            SalesTargetFormValues,
            UpdateSalesTargetRequest,
            unknown
        >
            title="Cập nhật chỉ tiêu"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={salesTargetSchema}
            uiSchema={salesTargetUiSchema}
            defaultValues={{
                employeeId: salesTarget.employee_id,
                period: salesTarget.period,
                bonGoc: salesTarget.bon_goc ?? 0,
                bonLaBot: salesTarget.bon_la_bot ?? 0,
                clcn: salesTarget.clcn ?? 0,
                bonLaLong: salesTarget.bon_la_long ?? 0,
            }}
            submitText="Lưu"
            loadingText="Đang lưu..."
            queryKeyToInvalidate={["sales-target"]}
            mutationFn={updateSalesTarget}
            mapFormToRequest={(values) => ({
                id: salesTarget.id,
                employee_id: values.employeeId || 0,
                period: values.period || 0,
                bon_goc: values.bonGoc,
                bon_la_bot: values.bonLaBot,
                clcn: values.clcn,
                bon_la_long: values.bonLaLong,
            })}
        />
    )
}