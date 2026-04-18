import { apiDelete, apiGet, apiPost, apiPut, type PagedResult } from "@/api/client"

type Id = number | string

export type BaseListParams = {
    page: number
    size: number
}

export function createCrudApi<
    TEntity,
    TCreateRequest,
    TUpdateRequest extends { id: Id },
    TListParams extends BaseListParams = BaseListParams
>(basePath: string) {
    return {
        detail(id: Id) {
            return apiGet<TEntity>(`${basePath}/${id}`)
        },

        list(params: TListParams) {
            return apiGet<PagedResult<TEntity>>(basePath, params)
        },

        create(body: TCreateRequest) {
            return apiPost<TEntity>(basePath, body)
        },

        update(body: TUpdateRequest) {
            return apiPut<TEntity>(`${basePath}/${body.id}`, body)
        },

        delete(id: Id) {
            return apiDelete<boolean>(`${basePath}/${id}`, { id })
        },
    }
}