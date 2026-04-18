import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

type CrudCreateButtonProps = {
    label?: string
    onClick: () => void
}

export function CrudCreateButton({
    label = 'Tạo mới',
    onClick,
}: CrudCreateButtonProps) {
    return (
        <Button className="space-x-1" onClick={onClick}>
            <span>{label}</span>
            <Plus size={18} />
        </Button>
    )
}