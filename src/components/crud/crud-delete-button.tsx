import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"

type CrudDeleteButtonProps<TId extends number | string> = {
    id: TId
    mutationFn: (id: TId) => Promise<unknown>
    queryKeyToInvalidate: readonly unknown[]
    confirmMessage?: string
    idleText?: string
    loadingText?: string
    className?: string
}

export function CrudDeleteButton<TId extends number | string>({
    id,
    mutationFn,
    queryKeyToInvalidate,
    confirmMessage = "Bạn có chắc muốn xoá bản ghi này không?",
    idleText = "Xoá",
    loadingText = "Đang xoá...",
    className = "h-8",
}: CrudDeleteButtonProps<TId>) {
    const queryClient = useQueryClient()

    const { mutate, isPending } = useMutation({
        mutationFn: () => mutationFn(id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate })
        },
    })

    const handleDelete = () => {
        const confirmed = window.confirm(confirmMessage)
        if (!confirmed) return
        mutate()
    }

    return (
        <Button
            type="button"
            variant="destructive"
            size="sm"
            className={className}
            disabled={isPending}
            onClick={handleDelete}
        >
            <Trash2 className="mr-1 size-4" />
            {isPending ? loadingText : idleText}
        </Button>
    )
}