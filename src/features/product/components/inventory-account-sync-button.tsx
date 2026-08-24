import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { getMyPermissions } from "@/api/auth/permission"
import {
    checkProductInventoryAccounts,
    syncProductInventoryAccounts,
    type ProductInventoryAccountCheckResult,
} from "@/api/product"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { formatNumber } from "@/lib/utils"

export function InventoryAccountSyncButton() {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [result, setResult] = useState<ProductInventoryAccountCheckResult | null>(null)

    const { data: permissions = [] } = useQuery({
        queryKey: ["my-permissions"],
        queryFn: getMyPermissions,
    })

    const canSync = hasPermission(permissions, "products", "inventory-account.sync")

    const checkMutation = useMutation({
        mutationFn: checkProductInventoryAccounts,
        onSuccess: (data) => {
            setResult(data)
            setOpen(true)
            if (data.mismatch > 0) {
                toast.warning(`Có ${formatNumber(data.mismatch)} sản phẩm lệch TK kho`)
            } else {
                toast.success("TK kho sản phẩm đã khớp với kho ngầm định")
            }
        },
        onError: (error: any) => {
            toast.error(error?.message || "Không thể kiểm tra TK kho")
        },
    })

    const syncMutation = useMutation({
        mutationFn: syncProductInventoryAccounts,
        onSuccess: async (data) => {
            setResult(data)
            await queryClient.invalidateQueries({ queryKey: ["product"] })
            await queryClient.invalidateQueries({ queryKey: ["product-summary"] })
            toast.success(`Đã cập nhật ${formatNumber(data.updated)} sản phẩm`)
        },
        onError: (error: any) => {
            toast.error(error?.message || "Không thể cập nhật TK kho")
        },
    })

    if (!canSync) return null

    const busy = checkMutation.isPending || syncMutation.isPending

    return (
        <>
            <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => checkMutation.mutate()}
            >
                {checkMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <ShieldCheck className="h-4 w-4" />
                )}
                Kiểm tra TK kho
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="w-[min(1280px,calc(100vw-2rem))] max-w-[min(1280px,calc(100vw-2rem))] sm:max-w-[min(1280px,calc(100vw-2rem))]">
                    <DialogHeader>
                        <DialogTitle>Kiểm tra TK kho sản phẩm</DialogTitle>
                        <DialogDescription>
                            Đối chiếu TK kho trên sản phẩm với TK kho của kho ngầm định.
                        </DialogDescription>
                    </DialogHeader>

                    {result ? (
                        <div className="space-y-4">
                            <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
                                <Metric label="Tổng sản phẩm" value={result.total_products} />
                                <Metric label="Đã đúng" value={result.matched} tone="good" />
                                <Metric label="Cần cập nhật" value={result.mismatch} tone={result.mismatch ? "warn" : "good"} />
                                <Metric label="Chưa có kho" value={result.missing_warehouse} />
                                <Metric label="Kho không tồn tại" value={result.missing_warehouse_ref} tone={result.missing_warehouse_ref ? "warn" : "neutral"} />
                                <Metric label="Kho thiếu TK" value={result.warehouse_missing_account} tone={result.warehouse_missing_account ? "warn" : "neutral"} />
                            </div>

                            {result.updated > 0 ? (
                                <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Đã cập nhật {formatNumber(result.updated)} sản phẩm. Còn lệch sau cập nhật: {formatNumber(result.mismatch)}.
                                </div>
                            ) : null}

                            {result.samples.length ? (
                                <div className="space-y-2">
                                    {result.mismatch > result.samples.length ? (
                                        <div className="text-xs text-muted-foreground">
                                            Đang hiển thị {formatNumber(result.samples.length)} / {formatNumber(result.mismatch)} dòng lệch đầu tiên.
                                        </div>
                                    ) : null}
                                    <div className="max-h-[420px] overflow-auto rounded-md border">
                                        <table className="w-full min-w-[980px] text-sm">
                                            <thead className="sticky top-0 bg-slate-100 text-xs uppercase text-slate-600">
                                                <tr>
                                                    <th className="border-b px-3 py-2 text-left">Sản phẩm</th>
                                                    <th className="border-b px-3 py-2 text-left">Kho ngầm định</th>
                                                    <th className="border-b px-3 py-2 text-center">TK hiện tại</th>
                                                    <th className="border-b px-3 py-2 text-center">TK đúng theo kho</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {result.samples.map((item) => (
                                                    <tr key={item.product_id} className="border-b last:border-b-0">
                                                        <td className="px-3 py-2">
                                                            <div className="font-medium">{item.product_name || "-"}</div>
                                                            <div className="font-mono text-xs text-muted-foreground">{item.product_code || `#${item.product_id}`}</div>
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <div className="font-medium">{item.warehouse_name || "-"}</div>
                                                            <div className="font-mono text-xs text-muted-foreground">{item.warehouse_code || `#${item.warehouse_id}`}</div>
                                                        </td>
                                                        <td className="px-3 py-2 text-center font-mono">{item.current_account_code || "-"}</td>
                                                        <td className="px-3 py-2 text-center font-mono font-semibold text-emerald-700">
                                                            {item.expected_account_code || "-"}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-md border bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
                                    Không có sản phẩm nào lệch TK kho có thể cập nhật.
                                </div>
                            )}
                        </div>
                    ) : null}

                    <DialogFooter>
                        <Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>
                            Đóng
                        </Button>
                        <Button
                            type="button"
                            disabled={busy || !result || result.mismatch === 0}
                            onClick={() => syncMutation.mutate()}
                        >
                            {syncMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Cập nhật TK kho
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

function Metric({
    label,
    value,
    tone = "neutral",
}: {
    label: string
    value: number
    tone?: "neutral" | "good" | "warn"
}) {
    const toneClass = {
        neutral: "border-slate-200 bg-slate-50 text-slate-700",
        good: "border-emerald-200 bg-emerald-50 text-emerald-800",
        warn: "border-amber-200 bg-amber-50 text-amber-800",
    }[tone]

    return (
        <div className={`rounded-md border p-3 ${toneClass}`}>
            <div className="text-xs font-medium uppercase">{label}</div>
            <div className="mt-1 text-right text-lg font-semibold tabular-nums">{formatNumber(value)}</div>
        </div>
    )
}

function hasPermission(permissions: any[], module: string, action: string) {
    return permissions.some((permission) =>
        (permission.module === module && permission.action === action)
        || permission.module === "*"
        || permission.action === "*",
    )
}
