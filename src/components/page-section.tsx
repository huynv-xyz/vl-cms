import { Main } from "@/components/layout/main"
import { cn } from "@/lib/utils"
import { useNavigate } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { ArrowLeft, type LucideIcon } from "lucide-react"
import { LoadingState } from "@/components/loading-state"

type PageSectionProps<T> = {
    isLoading: boolean
    error: unknown

    title?: string
    description?: string
    icon?: LucideIcon

    data?: T
    actions?: React.ReactNode

    showBack?: boolean
    backTo?: string

    header?: React.ReactNode

    className?: string
    children: (data: T) => React.ReactNode
}

export function PageSection<T>({
    isLoading,
    error,
    title,
    description,
    icon: Icon,
    data,
    actions,

    showBack,
    backTo,

    header,
    className,
    children,
}: PageSectionProps<T>) {

    const navigate = useNavigate()

    if (isLoading) {
        return (
            <Main>
                <LoadingState
                    variant="page"
                    title={title ? `Đang tải ${title.toLowerCase()}` : "Đang tải dữ liệu"}
                    description="Hệ thống đang lấy dữ liệu mới nhất."
                />
            </Main>
        )
    }

    if (error || !data) {
        return (
            <Main>
                <div className="p-4 text-sm text-red-500">
                    Lỗi tải dữ liệu.
                </div>
            </Main>
        )
    }

    return (
        <Main
            className={cn(
                "flex w-full min-w-0 max-w-full flex-1 flex-col gap-4 sm:gap-6",
                className
            )}
        >

            {header ? (
                header
            ) : (
                <div className="space-y-4 border-b pb-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                            {showBack && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="mt-1 shrink-0"
                                    onClick={() =>
                                        backTo
                                            ? navigate({ to: backTo })
                                            : navigate({ to: ".." })
                                    }
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                            )}

                            {Icon && (
                                <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                                    <Icon className="h-5 w-5" />
                                </div>
                            )}

                            <div className="min-w-0">
                                {title && (
                                    <h2 className="text-2xl font-bold tracking-tight">
                                        {title}
                                    </h2>
                                )}

                                {description && (
                                    <p className="text-muted-foreground text-sm mt-0.5">
                                        {description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {actions && (
                            <div className="shrink-0">{actions}</div>
                        )}
                    </div>
                </div>
            )}

            <div className="w-full min-w-0 max-w-full">
                {children(data)}
            </div>
        </Main>
    )
}
