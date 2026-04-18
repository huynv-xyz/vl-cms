import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function SwitchWidget(props: any) {
    const { id, value, onChange, label, disabled, readonly } = props

    return (
        <div className="flex items-center justify-between gap-2 py-1">
            <Label htmlFor={id} className="text-sm font-medium">
                {label}
            </Label>
            <Switch
                id={id}
                checked={!!value}
                disabled={disabled || readonly}
                onCheckedChange={(v) => onChange(v)}
            />
        </div>
    )
}
