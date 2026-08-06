import { useEffect, useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Save, UserCog } from "lucide-react"

import { adjustOrderSalesperson } from "@/api/sale/order"
import { getEmployee, listEmployees } from "@/api/employee"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

type Props = {
    open: boolean
    order: any
    onOpenChange: (open: boolean) => void
}

export function OrderSalespersonAdjustmentDialog({ open, order, onOpenChange }: Props) {
    const queryClient = useQueryClient()
    const [employeeId, setEmployeeId] = useState<number | undefined>()

    useEffect(() => {
        if (!open) return
        setEmployeeId(order?.employee_id ?? order?.employee?.id ?? undefined)
    }, [open, order])

    const currentEmployeeLabel = useMemo(
        () => formatEmployee(order?.employee),
        [order?.employee]
    )

    const mutation = useMutation({
        mutationFn: () => adjustOrderSalesperson(Number(order.id), Number(employeeId)),
        onSuccess: async (res: any) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["orders"] }),
                queryClient.invalidateQueries({ queryKey: ["order-detail", order.id] }),
                queryClient.invalidateQueries({ queryKey: ["sales-transactions"] }),
            ])

            const data = res?.data ?? res ?? {}
            const exportRows = Number(data.updated_export_transaction_rows ?? data.updatedExportTransactionRows ?? 0)
            const returnRows = Number(data.updated_return_transaction_rows ?? data.updatedReturnTransactionRows ?? 0)
            toast.success(`Đã sửa nhân viên bán. Cập nhật ${exportRows} dòng xuất, ${returnRows} dòng trả.`)
            onOpenChange(false)
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || error?.message || "Không thể sửa nhân viên bán")
        },
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[92vw] max-w-[720px] p-0">
                <DialogHeader className="border-b px-5 py-3">
                    <DialogTitle className="flex items-center gap-2">
                        Sửa nhân viên bán
                        <span className="font-mono text-sm text-primary">{order?.order_no}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 px-5 py-4">
                    <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 text-sm md:grid-cols-2">
                        <div>
                            <div className="text-xs font-semibold uppercase text-muted-foreground">
                                Nhân viên hiện tại
                            </div>
                            <div className="mt-1 font-semibold">{currentEmployeeLabel}</div>
                        </div>
                        <div>
                            <div className="text-xs font-semibold uppercase text-muted-foreground">
                                Trạng thái đơn
                            </div>
                            <div className="mt-1 font-semibold">{order?.status ?? "-"}</div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-sm font-semibold">
                            <UserCog className="h-4 w-4 text-muted-foreground" />
                            Nhân viên bán mới
                        </label>
                        <AsyncSelect
                            placeholder="Chọn nhân viên bán"
                            value={employeeId}
                            onChange={(value: any) => setEmployeeId(value ? Number(value) : undefined)}
                            dataSource={{
                                getList: (params: any) => listEmployees({ page: 1, size: 30, status: "1", ...params }),
                                getById: getEmployee,
                            }}
                            mapOption={(x: any) => ({
                                value: x.id,
                                label: formatEmployee(x),
                                raw: x,
                            })}
                            popoverContentClassName="w-[420px] max-w-[calc(100vw-2rem)]"
                        />
                    </div>

                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                        Khi lưu, hệ thống đổi nhân viên bán trên đơn hàng và đồng bộ lại các dòng dữ liệu bán hàng đã sinh từ phiếu xuất/trả hoàn thành của đơn này.
                    </div>
                </div>

                <DialogFooter className="border-t px-5 py-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button
                        className="gap-2"
                        disabled={mutation.isPending || !employeeId}
                        onClick={() => mutation.mutate()}
                    >
                        <Save className="h-4 w-4" />
                        Lưu thay đổi
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function formatEmployee(employee: any) {
    if (!employee) return "-"
    if (employee.code && employee.name) return `${employee.code} - ${employee.name}`
    return employee.name || employee.code || `#${employee.id}`
}
