import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { clearInventoryProductionTestData } from "@/api/inventory/test-reset"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

const CONFIRM_TEXT = "XOA DATA TEST"

const RESET_QUERY_KEYS = [
    ["inventory-ledger-report"],
    ["inventory-ledgers"],
    ["inventory-lots"],
    ["product-stocks"],
    ["production-orders"],
    ["production-order-detail"],
    ["productions"],
]

export function LedgerTestResetButton() {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [confirmText, setConfirmText] = useState("")
    const canSubmit = confirmText.trim().toUpperCase() === CONFIRM_TEXT

    const resetMutation = useMutation({
        mutationFn: clearInventoryProductionTestData,
        onSuccess: async (result) => {
            setOpen(false)
            setConfirmText("")
            for (const key of RESET_QUERY_KEYS) {
                await queryClient.invalidateQueries({ queryKey: key })
            }

            const total = Object.values(result.deleted ?? {}).reduce(
                (sum, value) => sum + Number(value || 0),
                0,
            )
            toast.success(`\u0110\u00e3 x\u00f3a ${total.toLocaleString("vi-VN")} d\u00f2ng data test`)
        },
        onError: (error: any) => {
            toast.error(error?.message || "Kh\u00f4ng th\u1ec3 x\u00f3a data test")
        },
    })

    const handleOpenChange = (nextOpen: boolean) => {
        if (!resetMutation.isPending) {
            setOpen(nextOpen)
            if (!nextOpen) setConfirmText("")
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button size="sm" variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    {"X\u00f3a t\u1ea5t c\u1ea3 data"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        {"X\u00f3a to\u00e0n b\u1ed9 data test T\u1ed3n kho/S\u1ea3n xu\u1ea5t"}
                    </DialogTitle>
                    <DialogDescription>
                        {"Thao t\u00e1c n\u00e0y s\u1ebd x\u00f3a to\u00e0n b\u1ed9 d\u1eef li\u1ec7u t\u1ed3n kho, s\u1ed5 kho, l\u00f4 FIFO, phi\u1ebfu kho v\u00e0 to\u00e0n b\u1ed9 l\u1ec7nh s\u1ea3n xu\u1ea5t hi\u1ec7n t\u1ea1i. Ch\u1ec9 d\u00f9ng \u0111\u1ec3 l\u00e0m s\u1ea1ch d\u1eef li\u1ec7u test."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                        {"D\u1eef li\u1ec7u \u0111\u00e3 x\u00f3a kh\u00f4ng th\u1ec3 kh\u00f4i ph\u1ee5c t\u1eeb m\u00e0n h\u00ecnh n\u00e0y. Danh m\u1ee5c s\u1ea3n ph\u1ea9m, kho, \u0111\u1ecba \u0111i\u1ec3m kho v\u00e0 BOM s\u1ebd \u0111\u01b0\u1ee3c gi\u1eef l\u1ea1i."}
                    </div>
                    <div className="space-y-2">
                        <div className="text-sm font-medium">
                            {"Nh\u1eadp"} <span className="font-mono">{CONFIRM_TEXT}</span> {"\u0111\u1ec3 x\u00e1c nh\u1eadn"}
                        </div>
                        <Input
                            value={confirmText}
                            onChange={(event) => setConfirmText(event.target.value)}
                            placeholder={CONFIRM_TEXT}
                            disabled={resetMutation.isPending}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline" disabled={resetMutation.isPending}>
                            {"H\u1ee7y"}
                        </Button>
                    </DialogClose>
                    <Button
                        type="button"
                        variant="destructive"
                        disabled={!canSubmit || resetMutation.isPending}
                        onClick={() => resetMutation.mutate()}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {resetMutation.isPending ? "\u0110ang x\u00f3a..." : "X\u00f3a data test"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
