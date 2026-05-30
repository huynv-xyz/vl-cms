import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { ExternalLink, Printer } from "lucide-react"
import { getExport } from "@/api/sale/export"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DialogLoadingState } from "@/components/loading-state"
import { ExportInfo } from "../../export-detail/components/export-info"
import { ExportItems } from "../../export-detail/components/export-items"

const EXPORT_DIALOG_PRINT_CSS = `
@media print {
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    height: auto !important;
    overflow: visible !important;
  }
  body * { visibility: hidden !important; }
  #export-dialog-print-document, #export-dialog-print-document * { visibility: visible !important; }
  #export-dialog-print-document {
    display: block !important;
    position: absolute !important;
    left: 50% !important;
    top: 0 !important;
    width: 200mm !important;
    max-width: 200mm !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    box-shadow: none !important;
    background: white !important;
    transform: translateX(-50%) !important;
    overflow: visible !important;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  #export-dialog-print-document .export-print-title { font-size: 17px !important; }
  #export-dialog-print-document .export-print-company { margin-bottom: 4px !important; }
  #export-dialog-print-document .export-print-info-lines { padding-top: 5px !important; padding-bottom: 5px !important; }
  #export-dialog-print-document table { font-size: 10px !important; line-height: 1.2 !important; }
  #export-dialog-print-document th,
  #export-dialog-print-document td { padding: 3px 5px !important; }
  #export-dialog-print-document .export-print-note { padding-top: 4px !important; padding-bottom: 4px !important; }
  #export-dialog-print-document .export-print-signatures { padding-top: 6px !important; padding-bottom: 6px !important; }
  #export-dialog-print-document .export-print-sign-date { margin-bottom: 10px !important; }
  #export-dialog-print-document .export-print-sign-space { margin-top: 32px !important; }
  #export-dialog-print-document table { page-break-inside: auto; }
  #export-dialog-print-document tr { page-break-inside: avoid; page-break-after: auto; }
  @page { size: A5 landscape; margin: 3mm; }
}
`

export function ExportDetailDialog({
    open,
    id,
    onClose,
}: {
    open: boolean
    id?: number
    onClose: () => void
}) {
    const query: any = useQuery({
        queryKey: ["export-detail", id],
        queryFn: () => getExport(id!),
        enabled: open && !!id,
    })

    const data = query.data?.data ?? query.data

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <style>{EXPORT_DIALOG_PRINT_CSS}</style>
            <DialogContent className="flex max-h-[92vh] w-[min(96vw,900px)] !max-w-none flex-col gap-0 overflow-hidden p-0 print:hidden">

                {/* ── Dialog header ── */}
                <DialogHeader className="flex-row items-center justify-between border-b bg-muted/20 px-5 py-3.5 space-y-0">
                    <DialogTitle className="text-base font-semibold">
                        Phiếu xuất kho
                        {data?.export_no && (
                            <span className="ml-2 font-mono text-primary">
                                {data.export_no}
                            </span>
                        )}
                    </DialogTitle>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.print()}
                        >
                            <Printer className="h-3.5 w-3.5 mr-1.5" />
                            In phiếu
                        </Button>

                        {id && (
                            <Button variant="ghost" size="sm" asChild>
                                <Link
                                    to="/sales/exports/$id"
                                    params={{ id: String(id) }}
                                    onClick={onClose}
                                >
                                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                    Trang đầy đủ
                                </Link>
                            </Button>
                        )}
                    </div>
                </DialogHeader>

                {/* ── Body ── */}
                <div className="min-h-0 flex-1 overflow-y-auto p-5">
                    {query.isLoading && <DialogLoadingState />}

                    {!query.isLoading && data && (
                        <div
                            className="bg-white rounded border border-gray-200 p-4"
                        >
                            <ExportInfo data={data} />
                            <ExportItems data={data} items={data.items ?? []} />
                        </div>
                    )}

                    {!query.isLoading && !data && !query.error && (
                        <div className="py-10 text-center text-sm text-muted-foreground">
                            Không tìm thấy phiếu xuất.
                        </div>
                    )}

                    {query.error && (
                        <div className="py-10 text-center text-sm text-red-500">
                            Lỗi tải dữ liệu.
                        </div>
                    )}
                </div>

            </DialogContent>

            {data && (
                <div id="export-dialog-print-document" className="hidden bg-white">
                    <ExportInfo data={data} />
                    <ExportItems data={data} items={data.items ?? []} />
                </div>
            )}
        </Dialog>
    )
}
