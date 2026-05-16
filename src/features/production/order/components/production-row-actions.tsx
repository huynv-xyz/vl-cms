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

    const { deleteById } = useCrudDelete(
        deleteProduction,
        ["productions"]
    )

    return (
        <CrudRowActions
            row={row.original}

            onEdit={canEdit ? () => openEdit(row.original) : undefined}

            onDelete={canEdit ? (r) => deleteById(r.id) : undefined}

            extraActions={(production) => (
                <>
                    <DropdownMenuItem asChild>
                        <Link
                            to="/production/orders/$id"
                            params={{ id: String(production.id) }}
                        >
                            Xem chi tiết
                        </Link>
                    </DropdownMenuItem>

                    {!canEdit && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="whitespace-normal text-xs font-normal text-muted-foreground">
                                Chỉ sửa lệnh khi còn Nháp hoặc Kế hoạch. Sau khi sinh vật tư, chỉnh vật tư/BOM trong trang chi tiết.
                            </DropdownMenuLabel>
                        </>
                    )}
                </>
            )}
        />
    )
}

function canEditProduction(production?: Pick<Production, "status">) {
    return ["DRAFT", "PLANNED"].includes(
        String(production?.status ?? "").toUpperCase()
    )
}
