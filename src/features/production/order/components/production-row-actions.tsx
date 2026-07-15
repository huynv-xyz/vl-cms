import { Row } from "@tanstack/react-table"
import { Link } from "@tanstack/react-router"
import { CalendarDays, Wrench } from "lucide-react"
import { useState } from "react"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import type { Production } from "../data/schema"
import { useProductions } from "../components/productions-provider"
import { deleteProduction } from "@/api/production/order"
import { useCrudDelete } from "@/hooks/use-crud-delete"
import { ChangeProductionDateDialog } from "./change-production-date-dialog"
import { AdjustProductionDialog } from "./adjust-production-dialog"
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
    const canEdit = canEditProduction(row.original)
    const canDelete = canDeleteProduction(row.original)

    const { deleteById } = useCrudDelete(
        deleteProduction,
        [["productions"], ["production-orders"]]
    )

    return (
        <>
            <CrudRowActions
                row={row.original}
                onEdit={canEdit ? () => openEdit(row.original) : undefined}
                onDelete={canDelete ? (r) => deleteById(r.id) : undefined}
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

                        {!canEdit && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="whitespace-normal text-xs font-normal text-muted-foreground">
                                    {"Ch\u1ec9 s\u1eeda l\u1ec7nh khi c\u00f2n Nh\u00e1p ho\u1eb7c K\u1ebf ho\u1ea1ch. C\u00f3 th\u1ec3 x\u00f3a l\u1ec7nh tr\u01b0\u1edbc khi ghi s\u1ed5 kho."}
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
        </>
    )
}

function canEditProduction(production?: Pick<Production, "status">) {
    return ["DRAFT", "PLANNED"].includes(statusOf(production))
}

function canDeleteProduction(production?: Pick<Production, "status">) {
    return ["DRAFT", "PLANNED", "MATERIAL_GENERATED", "FIFO_ALLOCATED", "CANCELLED"].includes(statusOf(production))
}

function statusOf(production?: Pick<Production, "status">) {
    return String(production?.status ?? "").toUpperCase()
}
