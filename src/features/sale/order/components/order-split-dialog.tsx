import { useEffect, useState } from "react";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import Decimal from "decimal.js-light";
import {
  ArrowLeft,
  Check,
  CopyPlus,
  Loader2,
  Scissors,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { apiPost } from "@/api/client";
import { getOrder } from "@/api/sale/order";
import { getWarehouse } from "@/api/warehouse";
import { getMyPermissions } from "@/api/auth/permission";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { getPriceBasis } from "../data/order-money";

type Part = { quantity: string; price: string; promotion: boolean };
type Mapping = { table: string; id: number; quantities: string[] };
type Request = {
  itemId: number;
  parts: Part[];
  mappings?: Mapping[];
  reason: string;
  token?: string;
};
type Document = {
  table: string;
  id: number;
  number: string;
  status: string;
  quantity: number;
  quantities: number[];
};
type Preview = {
  token: string;
  beforeTotal: number;
  afterTotal: number;
  arBefore: number;
  arAfter: number;
  documents: Document[];
  parts: {
    quantity: number;
    line_type?: string | null;
    amount_before_vat: number;
    vat_amount: number | null;
    total: number;
  }[];
  changes: Record<string, number>;
  errors: string[];
  stock: {
    document: string;
    part: number;
    warehouseId: number;
    lotCode: string;
    quantity: number;
  }[];
};

export function OrderSplitAction({
  order,
}: {
  order: { id: number; status?: string; order_no?: string };
}) {
  const [open, setOpen] = useState(false);
  const { data: permissions = [] } = useQuery({
    queryKey: ["my-permissions"],
    queryFn: getMyPermissions,
  });
  const allowed = ["update", "price.adjust"].every((action) =>
    permissions.some(
      (p: any) => p.module === "sales.orders" && p.action === action,
    ),
  );
  if (!allowed || order.status === "CANCELLED") return null;
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-9 gap-1.5"
        onClick={() => setOpen(true)}
      >
        <Scissors className="size-4" />
        Tách dòng
      </Button>
      <OrderSplitDialog open={open} orderId={order.id} onOpenChange={setOpen} />
    </>
  );
}

export function OrderSplitDialog({
  open,
  orderId,
  onOpenChange,
}: {
  open: boolean;
  orderId: number;
  onOpenChange: (open: boolean) => void;
}) {
  const client = useQueryClient();
  const orderQuery = useQuery({
    queryKey: ["order-split-detail", orderId],
    queryFn: () => getOrder(orderId),
    enabled: open,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
  const order = orderQuery.data as any;
  const [source, setSource] = useState<any>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [reason, setReason] = useState("");
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [checked, setChecked] = useState<{
    preview: Preview;
    request: Request;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const warehouseIds = [...new Set(checked?.preview.stock?.map((row) => row.warehouseId) ?? [])];
  const warehouseQueries = useQueries({
    queries: warehouseIds.map((id) => ({
      queryKey: ["warehouse", id],
      queryFn: () => getWarehouse(id),
      enabled: open,
      staleTime: 60_000,
    })),
  });
  const warehouseNames = new Map(warehouseIds.map((id, index) => [
    id,
    warehouseQueries[index].data?.name ?? (warehouseQueries[index].isError ? "Không tải được tên kho" : "..."),
  ]));
  useEffect(() => {
    if (!open) {
      setSource(null);
      setParts([]);
      setMappings([]);
      setDocuments([]);
      setChecked(null);
      setReason("");
      setError("");
    }
  }, [open, orderId]);

  const select = (item: any) => {
    const quantity = new Decimal(String(item.quantity));
    const first = quantity.div(2).toDecimalPlaces(3, Decimal.ROUND_DOWN);
    const price = String(
      item.line_type === "PROMOTION" ? 0 : getPriceBasis(item) === "VAT_INCLUSIVE"
        ? (item.unit_price_including_vat ?? 0)
        : (item.unit_price ?? 0),
    );
    setSource(item);
    setParts([
      { quantity: first.toString(), price, promotion: item.line_type === "PROMOTION" },
      { quantity: quantity.minus(first).toString(), price, promotion: item.line_type === "PROMOTION" },
    ]);
    setChecked(null);
    setMappings([]);
    setDocuments([]);
    setError("");
  };
  let difference = "0";
  let valid = false;
  try {
    difference = new Decimal(String(source?.quantity ?? 0))
      .minus(
        parts.reduce((sum, row) => sum.plus(row.quantity || 0), new Decimal(0)),
      )
      .toString();
    valid =
      parts.length >= 2 &&
      difference === "0" &&
      parts.every(
        (row) =>
          new Decimal(row.quantity).gt(0) && new Decimal(row.price).gte(0) &&
          (!row.promotion || new Decimal(row.price).eq(0)) &&
          (source.line_type !== "PROMOTION" || row.promotion),
      ) &&
      reason.trim().length > 0;
  } catch {
    valid = false;
  }
  const changePart = (index: number, patch: Partial<Part>) => {
    setParts((rows) =>
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
    setChecked(null);
    setMappings([]);
    setDocuments([]);
    setError("");
  };
  const check = async () => {
    const request: Request = {
      itemId: source.id,
      parts,
      reason: reason.trim(),
      mappings: mappings.length ? mappings : undefined,
    };
    setBusy(true);
    setError("");
    setChecked(null);
    try {
      const preview = await apiPost<Preview>(
        `/sales/orders/${orderId}/split-lines/check`,
        request,
      );
      setChecked({ preview, request });
      setDocuments(preview.documents ?? []);
      setMappings(
        (preview.documents ?? []).map((doc) => ({
          table: doc.table,
          id: doc.id,
          quantities: doc.quantities.map(String),
        })),
      );
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Không thể kiểm tra phương án",
      );
    } finally {
      setBusy(false);
    }
  };
  const apply = async () => {
    if (!checked || checked.preview.errors?.length) return;
    setBusy(true);
    setError("");
    try {
      await apiPost(`/sales/orders/${orderId}/split-lines`, {
        ...checked.request,
        token: checked.preview.token,
      });
      await client.invalidateQueries();
      toast.success("Đã tách dòng đơn hàng và đồng bộ chứng từ liên quan");
      onOpenChange(false);
    } catch (e: any) {
      setChecked(null);
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Không thể tách dòng; vui lòng kiểm tra lại trước khi gửi tiếp",
      );
    } finally {
      setBusy(false);
    }
  };
  const basis = source ? getPriceBasis(source) : "LEGACY";
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!busy) onOpenChange(value);
      }}
    >
      <DialogContent
        className="flex max-h-[92dvh] w-[96vw] max-w-[1200px] flex-col overflow-hidden p-0 sm:max-w-[1200px]"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>
            Tách dòng đơn hàng{" "}
            <span className="text-primary">{order?.order_no}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="min-h-0 space-y-4 overflow-auto px-5 py-4">
          {orderQuery.isPending && (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin" />
            </div>
          )}
          {orderQuery.isError && (
            <div role="alert" className="text-destructive">
              Không tải được đơn hàng.{" "}
              <Button variant="outline" onClick={() => orderQuery.refetch()}>
                Thử lại
              </Button>
            </div>
          )}
          {!source && order && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead className="text-right">Số lượng</TableHead>
                  <TableHead className="text-right">Đơn giá</TableHead>
                  <TableHead className="w-14" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(order.items ?? []).map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>{item.product?.name ?? item.product_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.product?.code ?? item.product_code}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(item.quantity)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(
                        getPriceBasis(item) === "VAT_INCLUSIVE"
                          ? item.unit_price_including_vat
                          : item.unit_price,
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Tách dòng ${item.product?.code ?? item.id}`}
                            onClick={() => select(item)}
                            disabled={Number(item.quantity) < 0.002}
                          >
                            <Scissors className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Tách dòng</TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {source && (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Chọn lại dòng"
                    disabled={busy}
                    onClick={() => {
                      setSource(null);
                      setChecked(null);
                    }}
                  >
                    <ArrowLeft className="size-4" />
                  </Button>
                  <div className="min-w-0">
                    <div className="font-medium">
                      {source.product?.name ?? source.product_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {source.product?.code ?? source.product_code} · VAT{" "}
                      {source.vat_code?.replace("VAT", "")
                        ? `${source.vat_code.replace("VAT", "")}${source.vat_code === "KCT" ? "" : "%"}`
                        : "-"}
                    </div>
                  </div>
                </div>
                <div className="text-sm">
                  Số lượng gốc: <strong>{formatNumber(source.quantity)}</strong>{" "}
                  ·{" "}
                  <span
                    className={
                      difference !== "0"
                        ? "text-destructive"
                        : "text-emerald-700"
                    }
                  >
                    Chênh: {formatNumber(Number(difference))}
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto border">
                <Table className="min-w-[740px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Dòng</TableHead>
                      <TableHead className="min-w-36 text-right">
                        Số lượng
                      </TableHead>
                      <TableHead className="w-28 text-center">Khuyến mãi</TableHead>
                      <TableHead className="min-w-44 text-right">
                        {basis === "VAT_INCLUSIVE"
                          ? "Đơn giá gồm VAT"
                          : basis === "LEGACY"
                            ? "Đơn giá (dữ liệu cũ)"
                            : "Đơn giá chưa VAT"}
                      </TableHead>
                      <TableHead className="w-24" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parts.map((part, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <Input
                            aria-label={`Số lượng dòng ${index + 1}`}
                            type="number"
                            min="0.001"
                            step="0.001"
                            className="text-right"
                            disabled={busy}
                            value={part.quantity}
                            onChange={(e) =>
                              changePart(index, { quantity: e.target.value })
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            aria-label={`Khuyến mãi dòng ${index + 1}`}
                            checked={part.promotion}
                            disabled={busy || source.line_type === "PROMOTION"}
                            onCheckedChange={(checked) => changePart(index, {
                              promotion: checked === true,
                              price: checked === true ? "0" : String(
                                basis === "VAT_INCLUSIVE"
                                  ? (source.unit_price_including_vat ?? 0)
                                  : (source.unit_price ?? 0),
                              ),
                            })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            aria-label={`Đơn giá dòng ${index + 1}`}
                            type="number"
                            min="0"
                            step="0.001"
                            className="text-right"
                            disabled={busy || part.promotion}
                            value={part.price}
                            onChange={(e) =>
                              changePart(index, { price: e.target.value })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  aria-label={`Thêm dòng từ dòng ${index + 1}`}
                                  disabled={busy || parts.length >= 20}
                                  onClick={() => {
                                    setParts([
                                      ...parts,
                                      { ...part, quantity: "0" },
                                    ]);
                                    setChecked(null);
                                    setMappings([]);
                                    setDocuments([]);
                                  }}
                                >
                                  <CopyPlus className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Thêm dòng</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  aria-label={`Bỏ dòng ${index + 1}`}
                                  disabled={busy || parts.length <= 2}
                                  onClick={() => {
                                    setParts(
                                      parts.filter((_, i) => i !== index),
                                    );
                                    setChecked(null);
                                    setMappings([]);
                                    setDocuments([]);
                                  }}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Bỏ dòng</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="space-y-1">
                <label htmlFor="split-reason" className="text-sm font-medium">
                  Lý do sửa sai
                </label>
                <Input
                  id="split-reason"
                  maxLength={500}
                  value={reason}
                  disabled={busy}
                  onChange={(e) => {
                    setReason(e.target.value);
                    setChecked(null);
                  }}
                />
              </div>
              {documents.length > 0 && (
                <section>
                  <h3 className="mb-2 text-sm font-semibold">
                    Ánh xạ chứng từ
                  </h3>
                  <div className="overflow-auto border">
                    <Table className="min-w-[700px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Chứng từ / dòng</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead className="text-right">SL gốc</TableHead>
                          {parts.map((_, i) => (
                            <TableHead key={i} className="min-w-32 text-right">
                              Dòng {i + 1}{parts[i]?.promotion ? " (KM)" : ""}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {documents.map((doc, di) => (
                          <TableRow key={`${doc.table}:${doc.id}`}>
                            <TableCell>
                              <div>{doc.number}</div>
                              <div className="text-xs text-muted-foreground">
                                {doc.table === "delivery_items"
                                  ? "Giao"
                                  : doc.table === "export_items"
                                    ? "Xuất"
                                    : "Trả"}{" "}
                                #{doc.id}
                              </div>
                            </TableCell>
                            <TableCell>{doc.status}</TableCell>
                            <TableCell className="text-right">
                              {formatNumber(doc.quantity)}
                            </TableCell>
                            {parts.map((_, pi) => (
                              <TableCell key={pi}>
                                <Input
                                  aria-label={`${doc.number} dòng ${doc.id} phân bổ ${pi + 1}`}
                                  type="number"
                                  step="0.001"
                                  min="0"
                                  disabled={busy}
                                  className="text-right"
                                  value={mappings[di]?.quantities[pi] ?? "0"}
                                  onChange={(e) => {
                                    setMappings((rows) =>
                                      rows.map((row, index) =>
                                        index === di
                                          ? {
                                              ...row,
                                              quantities: row.quantities.map(
                                                (q, p) =>
                                                  p === pi ? e.target.value : q,
                                              ),
                                            }
                                          : row,
                                      ),
                                    );
                                    setChecked(null);
                                  }}
                                />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </section>
              )}
              {checked && (
                <section className="space-y-3 border-t pt-3">
                  <h3 className="text-sm font-semibold">Kết quả kiểm tra</h3>
                  <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                    <div>
                      <dt className="text-muted-foreground">
                        Giá trị đơn trước
                      </dt>
                      <dd className="font-semibold">
                        {formatCurrency(checked.preview.beforeTotal)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Giá trị đơn sau</dt>
                      <dd className="font-semibold">
                        {formatCurrency(checked.preview.afterTotal)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">
                        Chênh lệch giá trị đơn
                      </dt>
                      <dd className="font-semibold">
                        {formatCurrency(
                          checked.preview.afterTotal -
                            checked.preview.beforeTotal,
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">
                        Chênh lệch công nợ đã ghi
                      </dt>
                      <dd className="font-semibold">
                        {formatCurrency(
                          checked.preview.arAfter - checked.preview.arBefore,
                        )}
                      </dd>
                    </div>
                  </dl>
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Dòng</TableHead>
                          <TableHead className="text-right">Chưa VAT</TableHead>
                          <TableHead className="text-right">Tiền VAT</TableHead>
                          <TableHead className="text-right">Gồm VAT</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {checked.preview.parts.map((row, i) => (
                          <TableRow key={i}>
                            <TableCell>{i + 1}{row.line_type === "PROMOTION" ? " · KM" : ""}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(row.amount_before_vat)}
                            </TableCell>
                            <TableCell className="text-right">
                              {row.vat_amount == null
                                ? "-"
                                : formatCurrency(row.vat_amount)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(row.total)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {!!checked.preview.stock?.length && (
                    <div className="overflow-auto">
                      <Table className="min-w-[600px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Chứng từ</TableHead>
                            <TableHead>Dòng mới</TableHead>
                            <TableHead>Kho</TableHead>
                            <TableHead>Lô</TableHead>
                            <TableHead className="text-right">
                              Số lượng
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {checked.preview.stock.map((row, i) => (
                            <TableRow key={i}>
                              <TableCell>{row.document}</TableCell>
                              <TableCell>{row.part}</TableCell>
                              <TableCell className="min-w-40 whitespace-normal">{warehouseNames.get(row.warehouseId)}</TableCell>
                              <TableCell>{row.lotCode}</TableCell>
                              <TableCell className="text-right">
                                {formatNumber(row.quantity)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  {checked.preview.errors?.length ? (
                    checked.preview.errors.map((message) => (
                      <div
                        key={message}
                        role="alert"
                        className="text-sm text-destructive"
                      >
                        {message}
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-emerald-700">
                      <Check className="size-4 shrink-0" />
                      Số lượng theo kho và lô được bảo toàn.
                    </div>
                  )}
                </section>
              )}
            </>
          )}
          {error && (
            <div
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}
        </div>
        <DialogFooter className="border-t px-5 py-3">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            Đóng
          </Button>
          {source && (
            <>
              <Button
                variant="outline"
                disabled={busy || !valid}
                onClick={check}
              >
                {busy && <Loader2 className="size-4 animate-spin" />}Kiểm tra
              </Button>
              <Button
                disabled={busy || !checked || !!checked.preview.errors?.length}
                onClick={apply}
              >
                <Scissors className="size-4" />
                Xác nhận tách dòng
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
