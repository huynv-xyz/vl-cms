import { useState, useEffect } from 'react'
import { Cross2Icon } from '@radix-ui/react-icons'
import { type Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTableFacetedFilter } from './faceted-filter'
import { cn } from '@/lib/utils'

// ========================
// 🔥 TYPE
// ========================
type SelectFilter = {
    columnId: string
    title: string
    values?: string[]
    onChange?: (values: string[]) => void
    options: {
        label: string
        value: string
        icon?: React.ComponentType<{ className?: string }>
    }[]
}

type CustomFilter = {
    columnId: string
    title: string
    render: () => React.ReactNode
}

type ToolbarFilter = SelectFilter | CustomFilter

type DataTableToolbarProps<TData> = {
    table: Table<TData>
    searchPlaceholder?: string
    keyword?: string
    searchInputClassName?: string
    onKeywordChange?: (value: string) => void
    filters?: ToolbarFilter[]
}

export function DataTableToolbar<TData>({
    table,
    searchPlaceholder = 'Filter...',
    keyword = '',
    searchInputClassName,
    onKeywordChange,
    filters = [],
}: DataTableToolbarProps<TData>) {

    const [inputValue, setInputValue] = useState(keyword)

    useEffect(() => {
        setInputValue(keyword)
    }, [keyword])

    const isFiltered =
        !!keyword ||
        filters.some((f) =>
            'values' in f &&
            Array.isArray(f.values) &&
            f.values.length > 0
        )

    return (
        <div role='toolbar' className='flex items-center justify-between gap-2'>

            <div className='flex flex-1 flex-wrap items-center gap-2'>

                <Input
                    placeholder={searchPlaceholder}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onBlur={() => {
                        if (inputValue !== keyword) {
                            onKeywordChange?.(inputValue)
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            onKeywordChange?.(inputValue)
                        }
                    }}
                    className={cn(
                        'h-9 w-[180px] lg:w-[260px]',
                        searchInputClassName
                    )}
                />

                {filters.map((filter) => {

                    if ('render' in filter) {
                        return (
                            <div
                                key={filter.columnId}
                                className="flex flex-col"
                            >
                                <span className="text-xs text-muted-foreground">
                                    {filter.title}
                                </span>
                                {filter.render()}
                            </div>
                        )
                    }

                    return (
                        <DataTableFacetedFilter
                            key={filter.columnId}
                            title={filter.title}
                            options={filter.options}
                            values={filter.values ?? []}
                            onChange={filter.onChange}
                        />
                    )
                })}

                {isFiltered && (
                    <Button
                        variant='ghost'
                        onClick={() => {
                            setInputValue('')
                            onKeywordChange?.('')

                            filters.forEach((f) => {
                                if ('onChange' in f) {
                                    f.onChange?.([])
                                }
                            })
                        }}
                        className='h-8 px-2 lg:px-3'
                    >
                        Đặt lại
                        <Cross2Icon className='ms-2 h-4 w-4' />
                    </Button>
                )}
            </div>

        </div>
    )
}
