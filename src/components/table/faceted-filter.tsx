import * as React from 'react'
import { CheckIcon, PlusCircledIcon } from '@radix-ui/react-icons'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'

type DataTableFacetedFilterProps = {
    title?: string
    values?: string[]
    onChange?: (values: string[]) => void
    options: {
        label: string
        value: string
        icon?: React.ComponentType<{ className?: string }>
    }[]
}

export function DataTableFacetedFilter({
    title,
    values = [],
    onChange,
    options,
}: DataTableFacetedFilterProps) {
    const selectedValues = new Set(values)

    const toggleValue = (value: string) => {
        const nextValues = new Set(selectedValues)

        if (nextValues.has(value)) {
            nextValues.delete(value)
        } else {
            nextValues.add(value)
        }

        onChange?.(Array.from(nextValues))
    }

    const clearValues = () => {
        onChange?.([])
    }

    const selectedOptions = options.filter((option) =>
        selectedValues.has(option.value),
    )

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant='outline' size='sm' className='h-8 border-dashed'>
                    <PlusCircledIcon className='size-4' />
                    {title}

                    {selectedValues.size > 0 && (
                        <>
                            <Separator orientation='vertical' className='mx-2 h-4' />

                            <Badge
                                variant='secondary'
                                className='rounded-sm px-1 font-normal lg:hidden'
                            >
                                {selectedValues.size}
                            </Badge>

                            <div className='hidden lg:flex lg:gap-1'>
                                {selectedValues.size > 2 ? (
                                    <Badge
                                        variant='secondary'
                                        className='rounded-sm px-1 font-normal'
                                    >
                                        Đã chọn {selectedValues.size}
                                    </Badge>
                                ) : (
                                    selectedOptions.map((option) => (
                                        <Badge
                                            key={option.value}
                                            variant='secondary'
                                            className='rounded-sm px-1 font-normal'
                                        >
                                            {option.label}
                                        </Badge>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent className='w-[220px] p-0' align='start'>
                <Command>
                    <CommandInput placeholder={title} />
                    <CommandList>
                        <CommandEmpty>Không tìm thấy kết quả.</CommandEmpty>

                        <CommandGroup>
                            {options.map((option) => {
                                const isSelected = selectedValues.has(option.value)

                                return (
                                    <CommandItem
                                        key={option.value}
                                        onSelect={() => toggleValue(option.value)}
                                    >
                                        <div
                                            className={cn(
                                                'border-primary flex size-4 items-center justify-center rounded-sm border',
                                                isSelected
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'opacity-50 [&_svg]:invisible',
                                            )}
                                        >
                                            <CheckIcon className='text-background h-4 w-4' />
                                        </div>

                                        {option.icon && (
                                            <option.icon className='text-muted-foreground size-4' />
                                        )}

                                        <span>{option.label}</span>
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>

                        {selectedValues.size > 0 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup>
                                    <CommandItem
                                        onSelect={clearValues}
                                        className='justify-center text-center'
                                    >
                                        Xóa bộ lọc
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}