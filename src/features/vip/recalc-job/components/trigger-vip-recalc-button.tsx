import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { triggerVipRecalc } from "@/api/customer-vip"
import { toast } from "sonner"

export function TriggerVipRecalcButton() {
    const queryClient = useQueryClient()
    const [isConfirming, setIsConfirming] = useState(false)

    const { mutate, isPending } = useMutation({
        mutationFn: () => triggerVipRecalc(),
        onSuccess: () => {
            toast.success("Đã kích hoạt tính lại VIP thành công")
            queryClient.invalidateQueries({ queryKey: ["vip-recalc-job"] })
            setIsConfirming(false)
        },
        onError: (err) => {
            toast.error(`Lỗi kích hoạt tính lại VIP: ${err instanceof Error ? err.message : "Unknown error"}`)
            setIsConfirming(false)
        },
    })

    if (isConfirming) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Xác nhận tính lại VIP?</span>
                <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => mutate()}
                    disabled={isPending}
                >
                    {isPending ? "Đang xử lý..." : "Xác nhận"}
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsConfirming(false)}
                    disabled={isPending}
                >
                    Hủy
                </Button>
            </div>
        )
    }

    return (
        <Button
            size="sm"
            variant="outline"
            onClick={() => setIsConfirming(true)}
            disabled={isPending}
        >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tính lại VIP
        </Button>
    )
}
