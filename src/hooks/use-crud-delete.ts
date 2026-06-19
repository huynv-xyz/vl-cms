import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

type Id = number | string

export function useCrudDelete(
    deleteApi: (id: Id) => Promise<any>,
    queryKey: any[] | any[][]
) {
    const queryClient = useQueryClient()
    const queryKeys = isQueryKeyList(queryKey) ? queryKey : [queryKey]

    const mutation = useMutation({
        mutationFn: deleteApi,

        onSuccess: () => {
            toast.success("X\u00f3a th\u00e0nh c\u00f4ng")

            for (const key of queryKeys) {
                void queryClient.invalidateQueries({ queryKey: key })
            }
        },

        onError: (err: any) => {
            toast.error(err?.message || "X\u00f3a th\u1ea5t b\u1ea1i")
        },
    })

    return {
        deleteById: mutation.mutateAsync,
        isDeleting: mutation.isPending,
    }
}

function isQueryKeyList(queryKey: any[] | any[][]): queryKey is any[][] {
    return Array.isArray(queryKey[0])
}
