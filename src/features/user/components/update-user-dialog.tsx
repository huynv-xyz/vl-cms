import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import {
    updateUser,
    type UpdateUserRequest,
} from "@/api/user"
import type { User } from "../data/schema"
import { userSchema, userUiSchema } from "./user-form-schema"
import type { UserFormValues } from "./types"

type Props = {
    user: User
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdateUserDialog({
    user,
    open,
    onOpenChange,
}: Props) {
    return (
        <CrudFormDialog<UserFormValues, UpdateUserRequest, unknown>
            title="Cập nhật User"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={userSchema}
            uiSchema={userUiSchema}
            defaultValues={{
                email: user.email,
                name: user.name,
                password: "",
                status: user.status === 1,
            }}
            submitText="Lưu"
            loadingText="Đang lưu..."
            queryKeyToInvalidate={["admin", "users"]}
            mutationFn={updateUser}
            mapFormToRequest={(values) => ({
                id: user.id,
                email: values.email.trim(),
                name: values.name.trim(),
                status: values.status === false ? 0 : 1,
            })}
        />
    )
}