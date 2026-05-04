import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

type UseConfirmActionOptions = {
    mutationFn: (id: number) => Promise<any>
    queryKey: string[]
    successMessage?: string
    errorMessage?: string
}

export function useConfirmAction({
    mutationFn,
    queryKey,
    successMessage = "Thành công",
    errorMessage = "Lỗi",
}: UseConfirmActionOptions) {

    const qc = useQueryClient()

    const mutation = useMutation({
        mutationFn,

        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey })
            toast.success(successMessage)
        },

        onError: (e: any) => {
            toast.error(e.message || errorMessage)
        },
    })

    return {
        confirm: mutation.mutateAsync,
        isConfirming: mutation.isPending,
    }
}