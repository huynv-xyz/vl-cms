import { useMutation, useQueryClient } from "@tanstack/react-query"
import { confirmDelivery } from "@/api/sale/delivery"
import { toast } from "sonner"

export function useConfirmDelivery() {
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: confirmDelivery,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["deliveries"] })
            toast.success("Đã xác nhận giao hàng")
        },
        onError: (e: any) => {
            toast.error(e.message || "Lỗi confirm")
        },
    })

    return {
        confirmDelivery: mutation.mutateAsync,
        isConfirming: mutation.isPending,
    }
}