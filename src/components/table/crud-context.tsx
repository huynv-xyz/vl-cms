import {
    createContext,
    useContext,
    useState,
    type ReactNode,
    type Dispatch,
    type SetStateAction,
} from 'react'
import useDialogState from '@/hooks/use-dialog-state'

export type CrudDialogType = 'create' | 'update' | 'delete' | 'import'

export type BaseCrudContext<T> = {
    open: CrudDialogType | null
    setOpen: (t: CrudDialogType | null) => void
    currentRow: T | null
    setCurrentRow: Dispatch<SetStateAction<T | null>>
}

/**
 * Tạo 1 cặp Provider + hook useCrud cho từng entity
 *
 * Ví dụ:
 *   export const { Provider: TasksProvider, useCrud: useTasksCrud } =
 *     createCrudContext<Task>()
 */
export function createCrudContext<T>() {
    const Ctx = createContext<BaseCrudContext<T> | null>(null)

    function Provider({ children }: { children: ReactNode }) {
        const [open, setOpen] = useDialogState<CrudDialogType>(null)
        const [currentRow, setCurrentRow] = useState<T | null>(null)

        return (
            <Ctx.Provider value={{ open, setOpen, currentRow, setCurrentRow }}>
                {children}
            </Ctx.Provider>
        )
    }

    const useCrud = () => {
        const ctx = useContext(Ctx)
        if (!ctx) {
            throw new Error('useCrud must be used within the Provider returned by createCrudContext')
        }
        return ctx
    }

    return { Provider, useCrud }
}
