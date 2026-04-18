import { useEffect, useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Form from "@rjsf/shadcn"
import type { RJSFSchema, UiSchema } from "@rjsf/utils"
import { toast } from "sonner"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ShadcnFieldTemplate } from "@/components/rjsf/shadcn-templates"
import { rjsfValidator } from "@/components/rjsf/rjsf-validator"
import { widgets } from "@/components/rjsf/widgets"

type CrudFormDialogProps<TFormValues, TRequest, TResponse> = {
    title: string
    trigger?: React.ReactNode
    hideTrigger?: boolean
    open?: boolean
    onOpenChange?: (open: boolean) => void
    schema: RJSFSchema
    uiSchema?: UiSchema
    defaultValues: TFormValues
    submitText?: string
    loadingText?: string
    queryKeyToInvalidate: readonly unknown[]
    mutationFn: (body: TRequest) => Promise<TResponse>
    mapFormToRequest: (values: TFormValues) => TRequest
    dialogClassName?: string
    formWrapperClassName?: string
    onSuccess?: (response: TResponse) => void
    successMessage?: string
    errorMessage?: string

    // 🔥 NEW
    onFormChange?: (formData: TFormValues) => Promise<TFormValues> | TFormValues
}

export function CrudFormDialog<TFormValues, TRequest, TResponse>({
    title,
    trigger,
    hideTrigger = false,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    schema,
    uiSchema,
    defaultValues,
    submitText = "Lưu",
    loadingText = "Đang xử lý...",
    queryKeyToInvalidate,
    mutationFn,
    mapFormToRequest,
    dialogClassName = "sm:max-w-2xl",
    formWrapperClassName,
    onSuccess,
    successMessage = "Thao tác thành công",
    errorMessage = "Thao tác thất bại",
    onFormChange,
}: CrudFormDialogProps<TFormValues, TRequest, TResponse>) {
    const [internalOpen, setInternalOpen] = useState(false)

    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = controlledOnOpenChange ?? setInternalOpen

    const [formData, setFormData] = useState<TFormValues>(defaultValues)
    const queryClient = useQueryClient()

    const initialData = useMemo(() => defaultValues, [defaultValues])

    useEffect(() => {
        if (open) {
            setFormData(initialData)
        }
    }, [open, initialData])

    const { mutate, isPending } = useMutation({
        mutationFn: (values: TFormValues) => mutationFn(mapFormToRequest(values)),
        onSuccess: async (response) => {
            await queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate })
            toast.success(successMessage)
            onSuccess?.(response)
            setOpen(false)
        },
        onError: (error: unknown) => {
            const message =
                error instanceof Error && error.message
                    ? error.message
                    : errorMessage

            toast.error(message)
        },
    })

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!hideTrigger && trigger && (
                <DialogTrigger asChild>{trigger}</DialogTrigger>
            )}

            <DialogContent className={`flex max-h-[85vh] flex-col overflow-hidden ${dialogClassName}`}>
                <DialogHeader className="shrink-0">
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <div className={`min-h-0 flex-1 overflow-y-auto pr-1 ${formWrapperClassName ?? ""}`}>
                    <Form
                        className="space-y-4"
                        validator={rjsfValidator}
                        schema={schema}
                        uiSchema={uiSchema}
                        widgets={widgets}
                        formData={formData}
                        templates={{ FieldTemplate: ShadcnFieldTemplate }}
                        noHtml5Validate
                        showErrorList={false}
                        disabled={isPending}

                        // 🔥 FIX CHÍNH Ở ĐÂY
                        onChange={async ({ formData }) => {
                            let data = formData as TFormValues

                            if (onFormChange) {
                                data = await onFormChange(data)
                            }

                            setFormData(data)
                        }}

                        onSubmit={({ formData }) => mutate(formData as TFormValues)}
                    >
                        <div className="sticky bottom-0 bg-background pt-4">
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isPending}
                            >
                                {isPending ? loadingText : submitText}
                            </Button>
                        </div>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    )
}