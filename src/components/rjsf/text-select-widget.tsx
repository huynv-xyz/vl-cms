import type { WidgetProps } from "@rjsf/utils"
import { ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function TextSelectWidget(props: WidgetProps) {
    const { id, value, onChange, disabled, readonly, placeholder } = props
    const options = (props.options?.options as string[] | undefined) ?? []
    const isDisabled = disabled || readonly

    return (
        <div className="flex gap-1">
            <Input
                id={id}
                value={value ?? ""}
                onChange={(event) => onChange(event.target.value)}
                disabled={isDisabled}
                placeholder={placeholder}
                autoComplete="off"
                className="min-w-0 flex-1"
            />
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={isDisabled}
                        className="shrink-0"
                    >
                        <ChevronsUpDown className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-40 p-1" align="end">
                    <div className="max-h-56 overflow-y-auto">
                        {options.map((option) => (
                            <button
                                key={option}
                                type="button"
                                className="hover:bg-accent hover:text-accent-foreground w-full rounded-sm px-2 py-1.5 text-left text-sm"
                                onClick={() => onChange(option)}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
