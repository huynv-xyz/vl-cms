import { ReactNode } from "react"
import { useNavigate } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

type Props = {
    title: string
    showBack?: boolean
    backTo?: string
    right?: ReactNode
}

export function PageHeader({
    title,
    showBack = false,
    backTo,
    right,
}: Props) {
    const navigate = useNavigate()

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">

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

                <h2 className="text-2xl font-bold tracking-tight">
                    {title}
                </h2>
            </div>

            {right}
        </div>
    )
}