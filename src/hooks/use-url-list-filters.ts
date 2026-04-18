import { parseMultiValue, stringifyMultiValue } from '@/lib/search-params'

type NavigateFn<TSearch> = (options: {
    search: (prev: TSearch) => TSearch
    replace?: boolean
}) => void

type BaseSearch = {
    page: number
    size: number
    keyword?: string
}

export function useUrlListFilters<
    TSearch extends BaseSearch,
    TMultiKey extends keyof TSearch & string,
    TSingleKey extends keyof TSearch & string = never,
>(
    search: TSearch,
    navigate: NavigateFn<TSearch>,
    multiKeys: readonly TMultiKey[],
    singleKeys: readonly TSingleKey[] = [],
) {
    const multiFilters = Object.fromEntries(
        multiKeys.map((key) => [
            key,
            parseMultiValue(search[key] as string | undefined),
        ]),
    ) as Record<TMultiKey, string[]>

    const singleFilters = Object.fromEntries(
        singleKeys.map((key) => [key, (search[key] as string | undefined) ?? '']),
    ) as Record<TSingleKey, string>

    const setKeyword = (value: string) => {
        navigate({
            search: (prev) => ({
                ...prev,
                keyword: value || '',
                page: 1,
            }),
            replace: true,
        })
    }

    const setMultiFilters = (next: Partial<Record<TMultiKey, string[]>>) => {
        navigate({
            search: (prev) => {
                const updated = { ...prev, page: 1 } as TSearch

                for (const key of multiKeys) {
                    if (key in next) {
                        ; (updated as Record<string, unknown>)[key] =
                            stringifyMultiValue(next[key])
                    }
                }

                return updated
            },
            replace: true,
        })
    }

    const setSingleFilters = (
        next: Partial<Record<TSingleKey, string | undefined>>,
    ) => {
        navigate({
            search: (prev) => {
                const updated = { ...prev, page: 1 } as TSearch

                for (const key of singleKeys) {
                    if (key in next) {
                        ; (updated as Record<string, unknown>)[key] =
                            next[key] || undefined
                    }
                }

                return updated
            },
            replace: true,
        })
    }

    const getMulti = (key: TMultiKey) => multiFilters[key]

    const setMulti = (key: TMultiKey, value: string[]) => {
        setMultiFilters({ [key]: value } as Partial<Record<TMultiKey, string[]>>)
    }

    const getSingle = (key: TSingleKey) => singleFilters[key]

    const setSingle = (key: TSingleKey, value?: string) => {
        setSingleFilters({
            [key]: value,
        } as Partial<Record<TSingleKey, string | undefined>>)
    }

    const requestFilters = {
        ...Object.fromEntries(
            multiKeys.map((key) => [key, stringifyMultiValue(multiFilters[key])]),
        ),
        ...Object.fromEntries(
            singleKeys.map((key) => [key, singleFilters[key] || undefined]),
        ),
    } as Record<TMultiKey | TSingleKey, string | undefined>

    return {
        keyword: search.keyword ?? '',
        setKeyword,
        multiFilters,
        setMultiFilters,
        singleFilters,
        setSingleFilters,
        getMulti,
        setMulti,
        getSingle,
        setSingle,
        requestFilters,
    }
}