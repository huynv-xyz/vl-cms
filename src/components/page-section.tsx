import { Main } from "@/components/layout/main"
import { cn } from "@/lib/utils"
import { useNavigate } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

type PageSectionProps<T> = {
    isLoading: boolean
    error: unknown

    title?: string
    description?: string

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
                <div className="p-4 text-sm">Đang tải...</div>
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
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">

                        {showBack && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                    backTo
                                        ? navigate({ to: backTo })
                                        : navigate({ to: ".." })
                                }
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        )}

                        <div className="min-w-0">
                            {title && (
                                <h2 className="text-2xl font-bold tracking-tight">
                                    {title}
                                </h2>
                            )}

                            {description && (
                                <p className="text-muted-foreground">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>

                    {actions}
                </div>
            )}

            <div className="w-full min-w-0 max-w-full">
                {children(data)}
            </div>
        </Main>
    )
}