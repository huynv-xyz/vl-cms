import { Row } from "@tanstack/react-table"
import { Link } from "@tanstack/react-router"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import type { Production } from "../data/schema"
import { useProductions } from "../components/productions-provider"
import { deleteProduction } from "@/api/production/order"
import { useCrudDelete } from "@/hooks/use-crud-delete"
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
    const canEdit = canEditProduction(row.original)
    const canDelete = canDeleteProduction(row.original)

    const { deleteById } = useCrudDelete(
        deleteProduction,
        [["productions"], ["production-orders"]]
    )

    return (
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
