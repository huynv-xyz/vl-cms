import type { OnChangeFn, PaginationState } from '@tanstack/react-table'

type NavigateFn<TSearch> = (options: {
    search: (prev: TSearch) => TSearch
    replace?: boolean
}) => void

type PaginationSearch = {
    page: number
    size: number
}

export function useUrlPagination<TSearch extends PaginationSearch>(
    search: TSearch,
    navigate: NavigateFn<TSearch>,
) {
    const pagination: PaginationState = {
        pageIndex: search.page - 1,
        pageSize: search.size,
    }

    const setPagination: OnChangeFn<PaginationState> = (updater) => {
        const next =
            typeof updater === 'function' ? updater(pagination) : updater

        navigate({
            search: (prev) => ({
                ...prev,
                page: next.pageIndex + 1,
                size: next.pageSize,
            }),
            replace: true,
        })
    }

    return {
        pagination,
        setPagination,
    }
}