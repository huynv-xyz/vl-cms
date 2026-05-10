import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

type UseUpdateStatusOptions<T> = {
    queryKey: any[]
    mutationFn: (id: number, status: string) => Promise<any>
    getId: (item: T) => number
}

export function useUpdateStatus<T>({
    queryKey,
    mutationFn,
    getId,
}: UseUpdateStatusOptions<T>) {

    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) =>
            mutationFn(id, status),

        onMutate: async ({ id, status }) => {

            await queryClient.cancelQueries({ queryKey })

            const prev = queryClient.getQueryData(queryKey)

            queryClient.setQueryData(queryKey, (old: any) => {
                if (!old) return old

                return {
                    ...old,
                    items: old.items.map((x: T) =>
                        getId(x) === id
                            ? { ...x, status }
                            : x
                    )
                }
            })

            return { prev }
        },

        onError: (_, __, context) => {
            queryClient.setQueryData(queryKey, context?.prev)
            toast.error("Cập nhật thất bại")
        },

        onSuccess: () => {
            toast.success("Cập nhật trạng thái thành công")
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey })
        },
    })
}