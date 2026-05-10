import { useQuery } from "@tanstack/react-query"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

type Props = {
    open: boolean
    id?: number
    onClose: () => void
    queryKey: any[]
    queryFn: (id: number) => Promise<any>
    title: string
    render: (data: any) => React.ReactNode
}

export function BaseDetailDialog({
    open,
    id,
    onClose,
    queryKey,
    queryFn,
    title,
    render,
}: Props) {

    const query: any = useQuery({
        queryKey: [...queryKey, id],
        queryFn: () => queryFn(id!),
        enabled: open && !!id,
    })

    const data = query.data?.data ?? query.data

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="!max-w-3xl w-full">

                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                {query.isLoading && (
                    <div className="text-sm text-muted-foreground">
                        Đang tải...
                    </div>
                )}

                {data && render(data)}

            </DialogContent>
        </Dialog>
    )
}