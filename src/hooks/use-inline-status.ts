import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function useInlineStatus<T>({
    queryKey,
    mutationFn,
    getId,
}: {
    queryKey: any[]
    mutationFn: (id: number, value: string) => Promise<any>
    getId: (row: T) => number
}) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ row, value }: { row: T; value: string }) =>
            mutationFn(getId(row), value),

        onMutate: async ({ row, value }) => {
            await queryClient.cancelQueries({ queryKey })

            const prev = queryClient.getQueryData(queryKey)

            queryClient.setQueryData(queryKey, (old: any) => {
                if (!old) return old

                return {
                    ...old,
                    items: old.items.map((x: any) =>
                        x.id === getId(row)
                            ? { ...x, status: value }
                            : x
                    ),
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