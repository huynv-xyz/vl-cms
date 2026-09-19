import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, CheckCircle2, Loader2, Trash2, XCircle } from "lucide-react"
import { toast } from "sonner"

import {
    checkProductionDeletion,
    softDeleteProduction,
    type ProductionDeletionResult,
} from "@/api/production/order"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { Production } from "../data/schema"

type Props = {
    production?: Production
    open: boolean
    onOpenChange: (open: boolean) => void
}

type ProductionDeletionError = Error & {
    data?: ProductionDeletionResult
}

export function DeleteProductionDialog({ production, open, onOpenChange }: Props) {
    const queryClient = useQueryClient()
    const [reason, setReason] = useState("")

    const check = useQuery({
        queryKey: ["production-delete-check", production?.id],
        queryFn: () => checkProductionDeletion(Number(production?.id)),
        enabled: open && !!production?.id,
        staleTime: 0,
        refetchOnMount: "always",
    })

    const errorResult = (check.error as ProductionDeletionError | null)?.data
    const result = check.data ?? errorResult
    const reasonValid = reason.trim().length >= 5
    const canExecute = !!result?.success && reasonValid && !check.isFetching

    const summary = useMemo(() => [
        { label: "Phiếu kho", value: result?.voucher_count ?? 0 },
        { label: "Dòng sổ kho", value: result?.ledger_count ?? 0 },
        { label: "Lô thành phẩm", value: result?.output_lot_count ?? 0 },
    ], [result])

    const deletion = useMutation({
        mutationFn: () => softDeleteProduction(Number(production?.id), reason.trim()),
        onSuccess: async (deleted) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["productions"] }),
                queryClient.invalidateQueries({ queryKey: ["production-orders"] }),
                queryClient.invalidateQueries({ queryKey: ["production-history"] }),
                queryClient.invalidateQueries({ queryKey: ["audit-logs"] }),
            ])
            toast.success(deleted.message || "Đã xóa mềm và hoàn tác lệnh sản xuất")
            onOpenChange(false)
        },
        onError: (error: ProductionDeletionError) => {
            toast.error(error?.message || "Không thể xóa lệnh sản xuất")
            void check.refetch()
        },
    })

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (deletion.isPending) return
                if (!nextOpen) setReason("")
                onOpenChange(nextOpen)
            }}
        >
            <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Trash2 className="h-5 w-5 text-red-600" />
                        Xóa lệnh sản xuất
                    </DialogTitle>
                    <DialogDescription>
                        Lệnh {production?.production_no || `#${production?.id}`}. Hệ thống kiểm tra dữ liệu phụ thuộc trước khi hoàn tác tồn kho và xóa mềm.
                    </DialogDescription>
                </DialogHeader>

                {check.isLoading || check.isFetching ? (
                    <div className="flex min-h-32 items-center justify-center gap-2 rounded-md border bg-muted/30 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang đối chiếu lệnh, phiếu kho, sổ kho và lô thành phẩm...
                    </div>
                ) : result ? (
                    <div className="space-y-4">
                        <div className={cn(
                            "flex gap-3 rounded-md border p-3",
                            result.success ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50",
                        )}>
                            {result.success
                                ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                                : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />}
                            <div>
                                <p className={cn("font-medium", result.success ? "text-emerald-800" : "text-red-800")}>
                                    {result.success ? "Có thể xóa an toàn" : "Chưa thể xóa lệnh"}
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">{result.message}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 divide-x rounded-md border bg-card">
                            {summary.map((item) => (
                                <div key={item.label} className="px-3 py-2 text-center">
                                    <div className="text-lg font-semibold tabular-nums">{item.value}</div>
                                    <div className="text-xs text-muted-foreground">{item.label}</div>
                                </div>
                            ))}
                        </div>

                        {!!result.details?.length && (
                            <div className="space-y-2">
                                {result.details.map((detail, index) => {
                                    const isError = detail.status === "ERROR"
                                    return (
                                        <div
                                            key={`${detail.type}-${index}`}
                                            className={cn(
                                                "flex gap-2 rounded-md border px-3 py-2 text-sm",
                                                isError ? "border-red-200 bg-red-50/70" : "border-sky-200 bg-sky-50/70",
                                            )}
                                        >
                                            {isError
                                                ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                                                : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />}
                                            <div className="min-w-0">
                                                <p className={cn("font-medium", isError ? "text-red-800" : "text-sky-800")}>{detail.message}</p>
                                                {detail.reference && <p className="mt-0.5 break-words text-xs text-muted-foreground">Đối chiếu: {detail.reference}</p>}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {result.success && (
                            <div className="space-y-2">
                                <label htmlFor="production-delete-reason" className="text-sm font-medium">
                                    Lý do xóa <span className="text-red-600">*</span>
                                </label>
                                <Textarea
                                    id="production-delete-reason"
                                    value={reason}
                                    onChange={(event) => setReason(event.target.value)}
                                    placeholder="Ví dụ: Chọn nhầm mã thành phẩm khi lập lệnh sản xuất"
                                    rows={3}
                                    disabled={deletion.isPending}
                                />
                                {!reasonValid && reason.length > 0 && (
                                    <p className="text-xs text-red-600">Lý do phải có ít nhất 5 ký tự.</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Dữ liệu chi tiết được giữ lại để truy vết; phiếu kho được chuyển sang Đã hủy và nhật ký đầy đủ được ghi tại Nhật ký hệ thống.
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                        {(check.error as Error | null)?.message || "Không thể kiểm tra dữ liệu lệnh sản xuất."}
                    </div>
                )}

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setReason("")
                            onOpenChange(false)
                        }}
                        disabled={deletion.isPending}
                    >
                        Đóng
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => deletion.mutate()}
                        disabled={!canExecute || deletion.isPending}
                    >
                        {deletion.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Xóa và hoàn tác
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
