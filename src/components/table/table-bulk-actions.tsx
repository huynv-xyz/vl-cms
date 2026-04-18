import { useState, useEffect, useRef } from 'react'
import { type Table } from '@tanstack/react-table'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip'

type DataTableBulkActionsProps<TData> = {
    table: Table<TData>
    entityName: string
    children: React.ReactNode
}

/**
 * Một thanh công cụ mô-đun để hiển thị các hành động hàng loạt khi các hàng trong bảng được chọn.
 *
 * @template TData Loại dữ liệu trong bảng.
 * @param {object} props Các thuộc tính của component.
 * @param {Table<TData>} props.table Thể hiện (instance) của react-table.
 * @param {string} props.entityName Tên của thực thể đang được thực hiện hành động (ví dụ: "công việc", "người dùng").
 * @param {React.ReactNode} props.children Các nút hành động được hiển thị bên trong thanh công cụ.
 * @returns {React.ReactNode | null} Component đã được render hoặc null nếu không có hàng nào được chọn.
 */
export function DataTableBulkActions<TData>({
    table,
    entityName,
    children,
}: DataTableBulkActionsProps<TData>): React.ReactNode | null {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const selectedCount = selectedRows.length
    const toolbarRef = useRef<HTMLDivElement>(null)
    const [announcement, setAnnouncement] = useState('')

    // Thông báo thay đổi lựa chọn cho trình đọc màn hình
    useEffect(() => {
        if (selectedCount > 0) {
            // Dịch: X [entityName](s) selected. Bulk actions toolbar is available.
            const entityNamePlural = selectedCount > 1 ? entityName + 's' : entityName // Giả định tiếng Anh: thêm 's'
            const message = `${selectedCount} ${entityNamePlural} đã được chọn. Thanh công cụ hành động hàng loạt đang khả dụng.`

            // Sử dụng queueMicrotask để trì hoãn cập nhật state và tránh render tầng
            queueMicrotask(() => {
                setAnnouncement(message)
            })

            // Xóa thông báo sau một khoảng thời gian
            const timer = setTimeout(() => setAnnouncement(''), 3000)
            return () => clearTimeout(timer)
        }
    }, [selectedCount, entityName])

    const handleClearSelection = () => {
        table.resetRowSelection()
    }

    const handleKeyDown = (event: React.KeyboardEvent) => {
        const buttons = toolbarRef.current?.querySelectorAll('button')
        if (!buttons) return

        const currentIndex = Array.from(buttons).findIndex(
            (button) => button === document.activeElement
        )

        switch (event.key) {
            case 'ArrowRight': {
                event.preventDefault()
                const nextIndex = (currentIndex + 1) % buttons.length
                buttons[nextIndex]?.focus()
                break
            }
            case 'ArrowLeft': {
                event.preventDefault()
                const prevIndex =
                    currentIndex === 0 ? buttons.length - 1 : currentIndex - 1
                buttons[prevIndex]?.focus()
                break
            }
            case 'Home':
                event.preventDefault()
                buttons[0]?.focus()
                break
            case 'End':
                event.preventDefault()
                buttons[buttons.length - 1]?.focus()
                break
            case 'Escape': {
                // Kiểm tra xem phím Escape có đến từ một trigger hoặc content của dropdown hay không
                // Chúng ta không thể kiểm tra trạng thái dropdown vì Radix UI đóng nó trước khi trình xử lý của chúng ta chạy
                const target = event.target as HTMLElement
                const activeElement = document.activeElement as HTMLElement

                // Kiểm tra xem mục tiêu sự kiện hoặc phần tử đang được focus có phải là trigger của dropdown hay không
                const isFromDropdownTrigger =
                    target?.getAttribute('data-slot') === 'dropdown-menu-trigger' ||
                    activeElement?.getAttribute('data-slot') ===
                    'dropdown-menu-trigger' ||
                    target?.closest('[data-slot="dropdown-menu-trigger"]') ||
                    activeElement?.closest('[data-slot="dropdown-menu-trigger"]')

                // Kiểm tra xem phần tử đang được focus có nằm trong content của dropdown hay không (đã được portaled)
                const isFromDropdownContent =
                    activeElement?.closest('[data-slot="dropdown-menu-content"]') ||
                    target?.closest('[data-slot="dropdown-menu-content"]')

                if (isFromDropdownTrigger || isFromDropdownContent) {
                    // Escape dành cho dropdown - không xóa lựa chọn
                    return
                }

                // Escape dành cho thanh công cụ - xóa lựa chọn
                event.preventDefault()
                handleClearSelection()
                break
            }
        }
    }

    if (selectedCount === 0) {
        return null
    }

    // Dịch: Bulk actions for X selected [entityName](s)
    const ariaLabel = `Hành động hàng loạt cho ${selectedCount} ${entityName}${selectedCount > 1 ? 's' : ''} đã chọn`

    return (
        <>
            {/* Vùng trực tiếp (Live region) cho thông báo của trình đọc màn hình */}
            <div
                aria-live='polite'
                aria-atomic='true'
                className='sr-only'
                role='status'
            >
                {announcement}
            </div>

            <div
                ref={toolbarRef}
                role='toolbar'
                aria-label={ariaLabel}
                aria-describedby='bulk-actions-description'
                tabIndex={-1}
                onKeyDown={handleKeyDown}
                className={cn(
                    'fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl',
                    'transition-all delay-100 duration-300 ease-out hover:scale-105',
                    'focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:outline-none'
                )}
            >
                <div
                    className={cn(
                        'p-2 shadow-xl',
                        'rounded-xl border',
                        'bg-background/95 supports-[backdrop-filter]:bg-background/60 backdrop-blur-lg',
                        'flex items-center gap-x-2'
                    )}
                >
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant='outline'
                                size='icon'
                                onClick={handleClearSelection}
                                className='size-6 rounded-full'
                                aria-label='Xóa lựa chọn' // Dịch: Clear selection
                                title='Xóa lựa chọn (Escape)' // Dịch: Clear selection (Escape)
                            >
                                <X />
                                <span className='sr-only'>Xóa lựa chọn</span> {/* Dịch: Clear selection */}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Xóa lựa chọn (Escape)</p> {/* Dịch: Clear selection (Escape) */}
                        </TooltipContent>
                    </Tooltip>

                    <Separator
                        className='h-5'
                        orientation='vertical'
                        aria-hidden='true'
                    />

                    <div
                        className='flex items-center gap-x-1 text-sm'
                        id='bulk-actions-description'
                    >
                        <Badge
                            variant='default'
                            className='min-w-8 rounded-lg'
                            aria-label={`${selectedCount} đã chọn`} // Dịch: X selected
                        >
                            {selectedCount}
                        </Badge>{' '}
                        <span className='hidden sm:inline'>
                            {entityName}
                            {selectedCount > 1 ? 's' : ''}
                        </span>{' '}
                        đã chọn {/* Dịch: selected */}
                    </div>

                    <Separator
                        className='h-5'
                        orientation='vertical'
                        aria-hidden='true'
                    />

                    {children}
                </div>
            </div>
        </>
    )
}