import { useState } from "react"
import { useQuery, type QueryKey } from "@tanstack/react-query"
import type { PaginationState } from "@tanstack/react-table"
import type { PagedResult } from "@/api/client"

type BaseListParams = {
    page: number
    size: number
}

type Fetcher<T, TExtraParams extends object = Record<string, never>> = (
    params: BaseListParams & TExtraParams
) => Promise<PagedResult<T>>

export function usePaginatedList<T, TExtraParams extends object = Record<string, never>>(
    baseKey: QueryKey,
    fetcher: Fetcher<T, TExtraParams>,
    extraParams?: TExtraParams,
    initialPageSize = 20,
) {
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: initialPageSize,
    })

    const query = useQuery({
        queryKey: [
            ...baseKey,
            pagination.pageIndex,
            pagination.pageSize,
            extraParams ?? {},
        ],
        queryFn: () =>
            fetcher({
                page: pagination.pageIndex + 1,
                size: pagination.pageSize,
                ...(extraParams ?? ({} as TExtraParams)),
            }),
        staleTime: 0,
        gcTime: 0,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: true,
    })

    return {
        ...query,
        pagination,
        setPagination,
    }
}