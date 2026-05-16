import { createContext, useContext, useMemo, useState, useEffect } from "react"
import type { ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"

export type CrudDialogType = "create" | "edit" | "delete" | "detail" | null

export type CrudDialogContextType<T, ID = number | string> = {
    open: CrudDialogType

    currentRow: T | null
    currentId: ID | null
    isFetching: boolean

    setOpen: (value: CrudDialogType) => void
    setCurrentRow: (value: T | null) => void
    setCurrentId: (id: ID | null) => void

    openCreate: () => void
    openEdit: (row: T) => void
    openEditById: (id: ID) => void
    openDetail: (row: T) => void
    openDelete: (row: T) => void
    close: () => void
}

export function createCrudDialogContext<
    T extends { id?: ID },
    ID = number | string
>(
    displayName: string,
    options?: {
        fetchById?: (id: ID) => Promise<T>
    }
) {
    const CrudDialogContext = createContext<CrudDialogContextType<T, ID> | null>(null)
    CrudDialogContext.displayName = displayName

    function Provider({ children }: { children: ReactNode }) {
        const [open, setOpen] = useState<CrudDialogType>(null)
        const [currentRow, setCurrentRow] = useState<T | null>(null)
        const [currentId, setCurrentId] = useState<ID | null>(null)

        // 🔥 AUTO FETCH DETAIL
        const { data, isFetching } = useQuery({
            queryKey: [displayName, "detail", currentId],
            queryFn: () => options?.fetchById?.(currentId as ID),
            enabled:
                open === "edit" &&
                !!currentId &&
                !currentRow &&
                !!options?.fetchById,
        })

        // 🔥 fill row khi fetch xong
        useEffect(() => {
            if (data) {
                setCurrentRow(data)
            }
        }, [data])

        const openCreate = () => {
            setCurrentRow(null)
            setCurrentId(null)
            setOpen("create")
        }

        const openEdit = (row: T) => {
            setCurrentRow(row)
            setCurrentId(row?.id ?? null)
            setOpen("edit")
        }

        const openEditById = (id: ID) => {
            setCurrentRow(null)
            setCurrentId(id)
            setOpen("edit")
        }

        const openDetail = (row: T) => {
            setCurrentRow(row)
            setCurrentId(row?.id ?? null)
            setOpen("detail")
        }

        const openDelete = (row: T) => {
            setCurrentRow(row)
            setCurrentId(row?.id ?? null)
            setOpen("delete")
        }

        const close = () => {
            setOpen(null)
            setCurrentRow(null)
            setCurrentId(null)
        }

        const value = useMemo(
            () => ({
                open,
                currentRow,
                currentId,
                isFetching,
                setOpen,
                setCurrentRow,
                setCurrentId,
                openCreate,
                openEdit,
                openEditById,
                openDetail,
                openDelete,
                close,
            }),
            [open, currentRow, currentId, isFetching]
        )

        return (
            <CrudDialogContext.Provider value={value}>
                {children}
            </CrudDialogContext.Provider>
        )
    }

    function useCrudDialog() {
        const ctx = useContext(CrudDialogContext)
        if (!ctx) {
            throw new Error(`${displayName} must be used within its Provider`)
        }
        return ctx
    }

    return {
        Provider,
        useCrudDialog,
    }
}
