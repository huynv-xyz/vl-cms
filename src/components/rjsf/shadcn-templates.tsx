import type { FieldTemplateProps } from "@rjsf/utils"
import { Label } from "@/components/ui/label"

export function ShadcnFieldTemplate(props: FieldTemplateProps) {
    const {
        id,
        classNames,
        label,
        required,
        description,
        children,
        hidden,
        rawErrors,
        schema,
        help,
    } = props

    if (hidden) return <div className="hidden">{children}</div>

    const isBoolean = schema.type === "boolean"
    const errorMessages = Array.isArray(rawErrors)
        ? Array.from(new Set(rawErrors))
        : []

    return (
        <div className={`flex flex-col gap-1 py-2 ${classNames ?? ""}`}>
            {!isBoolean && label && (
                <Label htmlFor={id} className="text-sm font-medium">
                    {label}
                    {required && <span className="ml-0.5 text-destructive">*</span>}
                </Label>
            )}

            {children}

            {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
            )}

            {errorMessages.length > 0 && (
                <p className="text-xs text-destructive">{errorMessages[0]}</p>
            )}

            {help}
        </div>
    )
}
