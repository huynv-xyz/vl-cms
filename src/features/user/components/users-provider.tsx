import type { User } from "../data/schema"
import { createCrudDialogContext } from "@/components/crud/create-crud-dialog-context"

const userDialogContext = createCrudDialogContext<User>("useUsers")

export const UsersProvider = userDialogContext.Provider
export const useUsers = userDialogContext.useCrudDialog