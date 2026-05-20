import {
    ChevronLeftIcon,
    ChevronRightIcon,
    DoubleArrowLeftIcon,
    DoubleArrowRightIcon,
} from "@radix-ui/react-icons"

import { Button } from "@/components/ui/button"
import { cn, getPageNumbers } from "@/lib/utils"

type CardPaginationProps = {
    pageIndex: number
    pageCount: number
    onPageChange: (pageIndex: number) => void
    className?: string
}

export function CardPagination({
    pageIndex,
    pageCount,
    onPageChange,
    className,
}: CardPaginationProps) {
    const totalPages = Math.max(pageCount, 1)
    const currentPage = Math.min(pageIndex + 1, totalPages)
    const pageNumbers = getPageNumbers(currentPage, totalPages)
    const canPrevious = pageIndex > 0
    const canNext = pageIndex < totalPages - 1

    return (
        <div className={cn("flex items-center justify-end px-2", className)}>
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    className="size-8 p-0"
                    onClick={() => onPageChange(0)}
                    disabled={!canPrevious}
                >
                    <span className="sr-only">Trang đầu tiên</span>
                    <DoubleArrowLeftIcon className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    className="size-8 p-0"
                    onClick={() => onPageChange(pageIndex - 1)}
                    disabled={!canPrevious}
                >
                    <span className="sr-only">Trang trước</span>
                    <ChevronLeftIcon className="h-4 w-4" />
                </Button>

                {pageNumbers.map((pageNumber, index) => (
                    <div key={`${pageNumber}-${index}`} className="flex items-center">
                        {pageNumber === "..." ? (
                            <span className="text-muted-foreground px-1 text-sm">...</span>
                        ) : (
                            <Button
                                variant={currentPage === pageNumber ? "default" : "outline"}
                                className="h-8 min-w-8 px-2"
                                onClick={() => onPageChange((pageNumber as number) - 1)}
                            >
                                <span className="sr-only">Đến trang {pageNumber}</span>
                                {pageNumber}
                            </Button>
                        )}
                    </div>
                ))}

                <Button
                    variant="outline"
                    className="size-8 p-0"
                    onClick={() => onPageChange(pageIndex + 1)}
                    disabled={!canNext}
                >
                    <span className="sr-only">Trang kế tiếp</span>
                    <ChevronRightIcon className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    className="size-8 p-0"
                    onClick={() => onPageChange(totalPages - 1)}
                    disabled={!canNext}
                >
                    <span className="sr-only">Trang cuối cùng</span>
                    <DoubleArrowRightIcon className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
