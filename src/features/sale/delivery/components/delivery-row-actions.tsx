import { useState } from "react"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useDeliveries } from "./deliverys-provider"
import { DropdownMenuItem, DropdownMenuShortcut } from "@/components/ui/dropdown-menu"
import { useConfirmDelivery } from "../hook/use-confirm-delivery"
import { CheckCircle } from "lucide-react"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function DeliveryRowActions({ row }) {
    const { openEdit } = useDeliveries()
    const { confirmDelivery, isConfirming } = useConfirmDelivery()

    const data = row.original

    const [openConfirm, setOpenConfirm] = useState(false)

    const handleConfirm = async () => {
        try {
            await confirmDelivery(data.id)
            setOpenConfirm(false)
        } catch (e) {
            // toast đã handle trong hook
        }
    }

    return (
        <>
            <CrudRowActions
                row={data}
                onEdit={() => openEdit(data)}
                extraActions={(row) => (
                    <>
                        {row.status !== "DONE" && (
                            <DropdownMenuItem
                                onClick={() => setOpenConfirm(true)}
                                className="flex items-center justify-between gap-2 whitespace-nowrap text-emerald-600 hover:bg-emerald-50"
                            >
                                <span className="font-medium">Xác nhận giao</span>
                                <DropdownMenuShortcut className="flex items-center">
                                    <CheckCircle size={16} />
                                </DropdownMenuShortcut>
                            </DropdownMenuItem>
                        )}
                    </>
                )}
            />

            {/* ===== CONFIRM DIALOG ===== */}
            <AlertDialog open={openConfirm} onOpenChange={setOpenConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Xác nhận giao hàng
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này sẽ:
                            <br />• Tạo phiếu xuất kho
                            <br />• Trừ tồn kho
                            <br />• Ghi nhận công nợ
                            <br />
                            <br />Bạn có chắc muốn tiếp tục?
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isConfirming}>
                            Huỷ
                        </AlertDialogCancel>

                        <AlertDialogAction
                            disabled={isConfirming}
                            onClick={(e) => {
                                e.preventDefault()
                                void handleConfirm()
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {isConfirming ? "Đang xử lý..." : "Xác nhận"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}