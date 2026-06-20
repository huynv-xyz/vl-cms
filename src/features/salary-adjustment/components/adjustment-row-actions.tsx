import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteAdjustment } from "@/api/salary/salary-adjustment"
import { toast } from "sonner"
import type { SalaryAdjustmentItem } from "../data/schema"
import { useAdjustments } from "./adjustments-provider"

export function AdjustmentRowActions({ item }: { item: SalaryAdjustmentItem }) {
  const { openEdit } = useAdjustments()
  const qc = useQueryClient()

  const { mutate: doDelete } = useMutation({
    mutationFn: () => deleteAdjustment(item.id),
    onSuccess: () => {
      toast.success("Đã xóa")
      qc.invalidateQueries({ queryKey: ["salary-adjustments"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => openEdit(item)}>
          <Pencil className="mr-2 h-4 w-4" /> Sửa
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => { if (confirm("Xóa điều chỉnh này?")) doDelete() }}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Xóa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
