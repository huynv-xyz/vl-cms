import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertCircle, Loader2, Save } from "lucide-react"
import { toast } from "sonner"

import {
    listInventoryAccountConfigs,
    updateInventoryAccountConfig,
    type InventoryAccountConfig,
    type InventoryAccountRule,
} from "@/api/inventory/account-config"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"

const PRODUCT_ACCOUNT = "PRODUCT_ACCOUNT"

type DraftRow = {
    tk_no: string
    tk_co: string
}

type DraftRules = Record<string, DraftRow>

export default function InventoryAccountConfigPage() {
    const queryClient = useQueryClient()
    const { data = [], isLoading, error } = useQuery({
        queryKey: ["inventory-account-config"],
        queryFn: listInventoryAccountConfigs,
    })
    const [drafts, setDrafts] = useState<Record<number, DraftRules>>({})

    useEffect(() => {
        setDrafts((current) => {
            const next = { ...current }
            for (const item of data) {
                if (!next[item.id]) {
                    next[item.id] = buildDraftRules(item)
                }
            }
            return next
        })
    }, [data])

    const grouped = useMemo(() => ({
        inbound: data.filter((item) => item.direction === "I"),
        outbound: data.filter((item) => item.direction === "O"),
        other: data.filter((item) => item.direction !== "I" && item.direction !== "O"),
    }), [data])

    const mutation = useMutation({
        mutationFn: ({ id, draft }: { id: number; draft: DraftRules }) =>
            updateInventoryAccountConfig(id, {
                account_rules: Object.entries(draft).map(([movementSide, rule]) => ({
                    movement_side: movementSide,
                    tk_no: normalizeAccount(rule.tk_no),
                    tk_co: normalizeAccount(rule.tk_co),
                })),
            }),
        onSuccess: (updated) => {
            setDrafts((current) => ({
                ...current,
                [updated.id]: buildDraftRules(updated),
            }))
            queryClient.invalidateQueries({ queryKey: ["inventory-account-config"] })
            queryClient.invalidateQueries({ queryKey: ["inventory-voucher-types"] })
            toast.success("Đã lưu cấu hình tài khoản")
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Không lưu được cấu hình tài khoản")
        },
    })

    const updateDraft = (id: number, movementSide: string, patch: Partial<DraftRow>) => {
        setDrafts((current) => ({
            ...current,
            [id]: {
                ...(current[id] ?? {}),
                [movementSide]: {
                    tk_no: current[id]?.[movementSide]?.tk_no ?? "",
                    tk_co: current[id]?.[movementSide]?.tk_co ?? "",
                    ...patch,
                },
            },
        }))
    }

    const saveRow = (item: InventoryAccountConfig) => {
        const draft = drafts[item.id] ?? buildDraftRules(item)
        mutation.mutate({ id: item.id, draft })
    }

    if (error) {
        return <div className="p-6 text-sm text-red-600">Lỗi tải cấu hình tài khoản.</div>
    }

    return (
        <div className="flex w-full min-w-0 flex-col gap-4 p-6">
            <div>
                <h1 className="text-2xl font-bold">Cấu hình tài khoản</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Thiết lập TK Nợ/Có mặc định theo loại phiếu kho. Có thể nhập tài khoản cố định hoặc lấy theo TK sản phẩm.
                </p>
            </div>

            <Alert className="border-sky-200 bg-sky-50 text-sky-800">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Quy tắc áp dụng</AlertTitle>
                <AlertDescription>
                    Cấu hình này áp dụng cho phiếu tạo mới và lúc ghi sổ. Các dòng đã ghi sổ sẽ không tự đổi lại TK Nợ/Có.
                </AlertDescription>
            </Alert>

            {isLoading ? (
                <div className="flex items-center gap-2 rounded-md border bg-white p-4 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tải cấu hình...
                </div>
            ) : (
                <div className="space-y-4">
                    <ConfigSection
                        title="Phiếu nhập kho"
                        items={grouped.inbound}
                        drafts={drafts}
                        updateDraft={updateDraft}
                        saveRow={saveRow}
                        savingId={mutation.variables?.id}
                        saving={mutation.isPending}
                    />
                    <ConfigSection
                        title="Phiếu xuất kho"
                        items={grouped.outbound}
                        drafts={drafts}
                        updateDraft={updateDraft}
                        saveRow={saveRow}
                        savingId={mutation.variables?.id}
                        saving={mutation.isPending}
                    />
                    {grouped.other.length > 0 && (
                        <ConfigSection
                            title="Loại phiếu khác"
                            items={grouped.other}
                            drafts={drafts}
                            updateDraft={updateDraft}
                            saveRow={saveRow}
                            savingId={mutation.variables?.id}
                            saving={mutation.isPending}
                        />
                    )}
                </div>
            )}
        </div>
    )
}

function ConfigSection({
    title,
    items,
    drafts,
    updateDraft,
    saveRow,
    savingId,
    saving,
}: {
    title: string
    items: InventoryAccountConfig[]
    drafts: Record<number, DraftRules>
    updateDraft: (id: number, movementSide: string, patch: Partial<DraftRow>) => void
    saveRow: (item: InventoryAccountConfig) => void
    savingId?: number
    saving: boolean
}) {
    if (!items.length) return null

    return (
        <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
            <div className="border-b bg-slate-50 px-3 py-2">
                <h2 className="text-sm font-semibold uppercase text-slate-700">{title}</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1180px] border-collapse text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                            <th className="w-[150px] border px-3 py-2 text-left font-semibold">Mã loại phiếu</th>
                            <th className="min-w-[260px] border px-3 py-2 text-left font-semibold">Tên loại phiếu</th>
                            <th className="w-[330px] border px-3 py-2 text-left font-semibold">TK Nợ</th>
                            <th className="w-[330px] border px-3 py-2 text-left font-semibold">TK Có</th>
                            <th className="w-[110px] border px-3 py-2 text-center font-semibold">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => {
                            const baseDraft = buildDraftRules(item)
                            const draft = drafts[item.id] ?? baseDraft
                            const sides = accountSides(item)
                            const dirty = sides.some((side) =>
                                normalizeAccount(draft[side]?.tk_no) !== normalizeAccount(baseDraft[side]?.tk_no)
                                || normalizeAccount(draft[side]?.tk_co) !== normalizeAccount(baseDraft[side]?.tk_co)
                            )
                            const rowSaving = saving && savingId === item.id

                            return (
                                <tr key={item.id}>
                                    <td className="border px-3 py-2 font-mono text-xs text-slate-700">{item.code}</td>
                                    <td className="border px-3 py-2">
                                        <div className="font-medium text-slate-900">{item.name}</div>
                                        {item.active !== 1 && <div className="mt-0.5 text-xs text-muted-foreground">Ngừng dùng</div>}
                                    </td>
                                    <td className="border px-3 py-2">
                                        <AccountRuleCell
                                            item={item}
                                            draft={draft}
                                            field="tk_no"
                                            updateDraft={updateDraft}
                                        />
                                    </td>
                                    <td className="border px-3 py-2">
                                        <AccountRuleCell
                                            item={item}
                                            draft={draft}
                                            field="tk_co"
                                            updateDraft={updateDraft}
                                        />
                                    </td>
                                    <td className="border px-3 py-2 text-center">
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => saveRow(item)}
                                            disabled={!dirty || rowSaving}
                                        >
                                            {rowSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                            Lưu
                                        </Button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    )
}

function AccountRuleCell({
    item,
    draft,
    field,
    updateDraft,
}: {
    item: InventoryAccountConfig
    draft: DraftRules
    field: keyof DraftRow
    updateDraft: (id: number, movementSide: string, patch: Partial<DraftRow>) => void
}) {
    const sides = accountSides(item)
    return (
        <div className="space-y-2">
            {sides.map((side) => (
                <div key={side} className="flex min-w-0 items-center gap-2">
                    {sides.length > 1 && (
                        <div className="w-14 shrink-0 text-xs font-medium text-slate-600">{sideLabel(side)}</div>
                    )}
                    <AccountEditor
                        value={draft[side]?.[field] ?? ""}
                        onChange={(value) => updateDraft(item.id, side, { [field]: value })}
                    />
                </div>
            ))}
        </div>
    )
}

function AccountEditor({
    value,
    onChange,
}: {
    value: string
    onChange: (value: string) => void
}) {
    const isProductAccount = normalizeAccount(value) === PRODUCT_ACCOUNT
    const [customValue, setCustomValue] = useState(isProductAccount ? "" : value)

    useEffect(() => {
        if (!isProductAccount) {
            setCustomValue(value)
        }
    }, [isProductAccount, value])

    return (
        <div className="flex min-w-0 items-center gap-2">
            <RadioGroup
                value={isProductAccount ? "product" : "custom"}
                onValueChange={(mode) => {
                    if (mode === "product") {
                        onChange(PRODUCT_ACCOUNT)
                        return
                    }
                    onChange(customValue)
                }}
                className="flex shrink-0 items-center gap-2"
            >
                <Label className="flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap text-xs font-normal">
                    <RadioGroupItem value="product" className="h-3.5 w-3.5" />
                    Theo TK sản phẩm
                </Label>
                <Label className="flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap text-xs font-normal">
                    <RadioGroupItem value="custom" className="h-3.5 w-3.5" />
                    Nhập TK
                </Label>
            </RadioGroup>
            <Input
                value={isProductAccount ? "" : value}
                onChange={(event) => {
                    setCustomValue(event.target.value)
                    onChange(event.target.value)
                }}
                placeholder={isProductAccount ? "Lấy theo TK sản phẩm" : "Nhập số tài khoản"}
                disabled={isProductAccount}
                className={cn("h-8 min-w-[130px] flex-1 font-mono text-sm", isProductAccount && "bg-slate-50 text-muted-foreground")}
            />
        </div>
    )
}

function normalizeAccount(value?: string | null) {
    const trimmed = (value || "").trim()
    if (!trimmed) return ""
    if (trimmed.toUpperCase() === PRODUCT_ACCOUNT) return PRODUCT_ACCOUNT
    return trimmed
}

function buildDraftRules(item: InventoryAccountConfig): DraftRules {
    const rules = item.account_rules || []
    const draft: DraftRules = {}
    for (const side of accountSides(item)) {
        const rule = findRule(rules, side)
        draft[side] = {
            tk_no: rule?.tk_no || (side === "DEFAULT" ? item.tk_no || "" : ""),
            tk_co: rule?.tk_co || (side === "DEFAULT" ? item.tk_co || "" : ""),
        }
    }
    return draft
}

function accountSides(item: InventoryAccountConfig) {
    return isTwoSidedType(item.code) ? ["OUTBOUND", "INBOUND"] : ["DEFAULT"]
}

function isTwoSidedType(code?: string) {
    return code === "TRANSFER_EXPORT" || code === "TRANSPORT_EXPORT"
}

function findRule(rules: InventoryAccountRule[], side: string) {
    return rules.find((rule) => rule.movement_side === side)
}

function sideLabel(side: string) {
    if (side === "OUTBOUND") return "Vế xuất"
    if (side === "INBOUND") return "Vế nhập"
    return ""
}
