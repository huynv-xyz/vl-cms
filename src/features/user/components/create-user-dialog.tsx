import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import {
    createUser,
    type CreateUserRequest,
} from "@/api/user"
import { userSchema, userUiSchema } from "./user-form-schema"
import type { UserFormValues } from "./types"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateUserDialog({
    open,
    onOpenChange,
}: Props) {
    return (
        <CrudFormDialog<UserFormValues, CreateUserRequest, unknown>
            title="Tạo User"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={userSchema}
            uiSchema={userUiSchema}
            defaultValues={{
                email: "",
                name: "",
                password: "",
                status: true,
            }}
            submitText="Tạo mới"
            loadingText="Đang tạo..."
            queryKeyToInvalidate={["admin", "users"]}
            mutationFn={createUser}
            mapFormToRequest={(values) => ({
                email: values.email.trim(),
                name: values.name.trim(),
                password: values.password ?? "",
                status: values.status === false ? 0 : 1,
            })}
        />
    )
}