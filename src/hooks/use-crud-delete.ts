import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

type Id = number | string

export function useCrudDelete(
    deleteApi: (id: Id) => Promise<any>,
    queryKey: any[]
) {
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: deleteApi,

        onSuccess: () => {
            toast.success("Xoá thành công")

            queryClient.invalidateQueries({
                queryKey,
            })
        },

        onError: (err: any) => {
            toast.error(err?.message || "Xoá thất bại")
        },
    })

    return {
        deleteById: mutation.mutateAsync,
        isDeleting: mutation.isPending,
    }
}