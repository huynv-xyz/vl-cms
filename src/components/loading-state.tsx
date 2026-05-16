import { Loader2 } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type LoadingStateProps = {
    title?: string
    description?: string
    variant?: "page" | "card" | "inline"
    rows?: number
    className?: string
}

export function LoadingState({
    title = "Đang tải dữ liệu",
    description = "Vui lòng chờ trong giây lát.",
    variant = "card",
    rows = 6,
    className,
}: LoadingStateProps) {
    if (variant === "inline") {
        return (
            <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{title}</span>
            </div>
        )
    }

    return (
        <div className={cn("rounded-md border bg-background", variant === "page" && "p-5", className)}>
            <div className="flex items-center justify-between gap-4 border-b px-4 py-3">
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </span>
                    <div>
                        <div className="font-semibold">{title}</div>
                        <div className="text-sm text-muted-foreground">{description}</div>
                    </div>
                </div>
                <Skeleton className="hidden h-8 w-28 sm:block" />
            </div>

            <div className="space-y-3 p-4">
                <div className="grid gap-3 md:grid-cols-3">
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                </div>

                <div className="rounded-md border">
                    {Array.from({ length: rows }).map((_, index) => (
                        <div
                            key={index}
                            className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.7fr] gap-4 border-b p-3 last:border-b-0"
                        >
                            <Skeleton className="h-5" />
                            <Skeleton className="h-5" />
                            <Skeleton className="h-5" />
                            <Skeleton className="h-5" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export function DialogLoadingState({ title = "Đang tải dữ liệu" }: { title?: string }) {
    return (
        <div className="space-y-4">
            <LoadingState title={title} description="Đang chuẩn bị thông tin hiển thị." rows={4} />
        </div>
    )
}
