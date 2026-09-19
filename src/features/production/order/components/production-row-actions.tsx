import type { Row } from "@tanstack/react-table"
import { Link } from "@tanstack/react-router"
import { CalendarDays, Trash2, Wrench } from "lucide-react"
import { useState } from "react"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import type { Production } from "../data/schema"
import { useProductions } from "../components/productions-provider"
import { ChangeProductionDateDialog } from "./change-production-date-dialog"
import { AdjustProductionDialog } from "./adjust-production-dialog"
import { DeleteProductionDialog } from "./delete-production-dialog"
import { useProductionPermissions } from "../hooks/use-production-permissions"
import {
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

type Props = {
    row: Row<Production>
}

export function ProductionRowActions({ row }: Props) {
    const { openEdit } = useProductions()
    const permissions = useProductionPermissions()
    const [changeDateOpen, setChangeDateOpen] = useState(false)
    const [adjustOpen, setAdjustOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const canEdit = permissions.canUpdate && canEditProduction(row.original)
    const canDelete = canDeleteProduction(
        row.original,
        permissions.canDelete,
        permissions.canDeleteCompleted,
    )

    return (
        <>
            <CrudRowActions
                row={row.original}
                onEdit={canEdit ? () => openEdit(row.original) : undefined}
                extraActions={(production) => (
                    <>
                        <DropdownMenuItem asChild>
                            <Link
                                to="/production/orders/$id"
                                params={{ id: String(production.id) }}
                            >
                                {"Xem chi ti\u1ebft"}
                            </Link>
                        </DropdownMenuItem>

                        {permissions.canChangeDate && (
                            <DropdownMenuItem
                                onSelect={(event) => {
                                    event.preventDefault()
                                    setChangeDateOpen(true)
                                }}
                            >
                                <CalendarDays className="mr-2 h-4 w-4" />
                                Đổi ngày
                            </DropdownMenuItem>
                        )}

                        {permissions.canAdjustDone && statusOf(production) === "DONE" && (
                            <DropdownMenuItem
                                onSelect={(event) => {
                                    event.preventDefault()
                                    setAdjustOpen(true)
                                }}
                            >
                                <Wrench className="mr-2 h-4 w-4" />
                                Điều chỉnh
                            </DropdownMenuItem>
                        )}

                        {canDelete && (
                            <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onSelect={(event) => {
                                    event.preventDefault()
                                    setDeleteOpen(true)
                                }}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Xóa lệnh
                            </DropdownMenuItem>
                        )}

                        {!canEdit && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="whitespace-normal text-xs font-normal text-muted-foreground">
                                    Chỉ sửa lệnh khi còn Nháp hoặc Kế hoạch. Xóa lệnh đã ghi sổ cần quyền hoàn tác riêng.
                                </DropdownMenuLabel>
                            </>
                        )}
                    </>
                )}
            />
            <ChangeProductionDateDialog
                production={row.original}
                open={changeDateOpen}
                onOpenChange={setChangeDateOpen}
            />
            <AdjustProductionDialog
                production={row.original}
                open={adjustOpen}
                onOpenChange={setAdjustOpen}
            />
            <DeleteProductionDialog
                production={row.original}
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
            />
        </>
    )
}

function canEditProduction(production?: Pick<Production, "status">) {
    return ["DRAFT", "PLANNED"].includes(statusOf(production))
}

function canDeleteProduction(
    production: Pick<Production, "status"> | undefined,
    canDelete: boolean,
    canDeleteCompleted: boolean,
) {
    const status = statusOf(production)
    if (["DELETED", "LOCKED"].includes(status)) return false
    if (["MATERIAL_ISSUED", "OUTPUT_RECEIVED", "DONE"].includes(status)) {
        return canDeleteCompleted
    }
    return canDelete || canDeleteCompleted
}

function statusOf(production?: Pick<Production, "status">) {
    return String(production?.status ?? "").toUpperCase()
}
