import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SalaryPeriodStepper, currentSalaryPeriod } from "@/components/salary/period-stepper"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { deleteEmployeeScope, createEmployeeScope, createManagerMapping, deleteManagerMapping, listEmployeeScopes, listManagerMappings, updateEmployeeScope, updateManagerMapping, type EmployeeScopeItem, type ManagerMappingItem } from "@/api/salary/salary-setup"
import { createRoleRate, createSalaryRole, deleteRoleRate, deleteSalaryRole, listRoleRates, listSalaryRoles, updateRoleRate, updateSalaryRole, type RoleRateItem, type SalaryRoleItem } from "@/api/salary/salary-role"
import { getEmployee, listEmployees } from "@/api/employee"
import { listRegions } from "@/api/region"
import { listProvinces } from "@/api/province"
import { CalendarDays, GitBranch, Pencil, Plus, ShieldCheck, Trash2, UsersRound } from "lucide-react"

const EMPTY = "__EMPTY__"

function compactPeriod(value: string) {
  return Number(value.replace("-", ""))
}

function prettyPeriod(value?: string | number | null) {
  const raw = String(value ?? "")
  if (/^\d{6}$/.test(raw)) return `${raw.slice(0, 4)}-${raw.slice(4)}`
  return raw
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function moneyPct(value?: number | null) {
  if (value == null) return "-"
  return `${(value * 100).toLocaleString("vi-VN", { maximumFractionDigits: 2 })}%`
}

function toRate(value: string) {
  const n = Number(value.replace(",", "."))
  return Number.isFinite(n) ? n / 100 : 0
}

function Field({ label, children, hint, required }: { label: string; children: ReactNode; hint?: string; required?: boolean }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function employeeDataSource() {
  return {
    getList: (params: any) => listEmployees({ page: 1, size: 20, status: "1", ...params }),
    getById: getEmployee,
    params: { page: 1, size: 20, status: "1" },
  }
}

function employeeOption(item: any) {
  return { value: item.id, label: `${item.code} - ${item.name}`, raw: item }
}

export default function SalarySetupPage() {
  useSalarySetupRefresh()
  const [period, setPeriod] = useState(currentSalaryPeriod())

  const { data: rolesData } = useQuery({ queryKey: ["salary-setup-roles"], queryFn: () => listSalaryRoles({ status: 1 }) })
  const { data: employeesData } = useQuery({ queryKey: ["salary-setup-employees"], queryFn: () => listEmployees({ page: 1, size: 1000, status: "1" }) })
  const { data: regionsData } = useQuery({ queryKey: ["salary-setup-regions"], queryFn: () => listRegions({ page: 1, size: 500 }) })
  const { data: provincesData } = useQuery({ queryKey: ["salary-setup-provinces"], queryFn: () => listProvinces({ page: 1, size: 500 }) })
  const { data: scopesData, isLoading: scopesLoading } = useQuery({ queryKey: ["salary-setup-scopes"], queryFn: () => listEmployeeScopes() })
  const { data: mappingsData, isLoading: mappingsLoading } = useQuery({ queryKey: ["salary-setup-mappings"], queryFn: listManagerMappings })
  const { data: ratesData, isLoading: ratesLoading } = useQuery({ queryKey: ["salary-setup-rates"], queryFn: () => listRoleRates() })

  const roles = rolesData?.items ?? []
  const employees = employeesData?.items ?? []
  const regions = regionsData?.items ?? []
  const provinces = provincesData?.items ?? []
  const scopes = scopesData?.items ?? []
  const mappings = mappingsData?.items ?? []
  const rates = ratesData?.items ?? []

  const roleMap = useMemo(() => new Map(roles.map((item) => [item.id, `${item.code} - ${item.name}`])), [roles])
  const employeeMap = useMemo(() => new Map(employees.map((item) => [item.id, `${item.code} - ${item.name}`])), [employees])
  const regionMap = useMemo(() => new Map(regions.map((item) => [item.id, `${item.code} - ${item.name}`])), [regions])
  const provinceMap = useMemo(() => new Map(provinces.map((item) => [item.id, `${item.code} - ${item.name}`])), [provinces])

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Thiết lập lương</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Quản lý các dữ liệu đầu vào để chạy lương: phân công nhân sự, sơ đồ quản lý Sale - ASM - RM, vai trò lương và tỷ lệ hưởng.
          </p>
        </div>
        <div className="w-44">
          <Label className="mb-2 block text-xs font-semibold text-muted-foreground">Kỳ mapping</Label>
          <SalaryPeriodStepper value={period} onChange={setPeriod} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard icon={<UsersRound className="h-4 w-4" />} label="Phân công" value={String(scopes.length)} />
        <SummaryCard icon={<GitBranch className="h-4 w-4" />} label="Mapping quản lý" value={String(mappings.length)} />
        <SummaryCard icon={<ShieldCheck className="h-4 w-4" />} label="Vai trò lương" value={String(roles.length)} />
        <SummaryCard icon={<CalendarDays className="h-4 w-4" />} label="Tỷ lệ vai trò" value={String(rates.length)} />
      </div>

      <Tabs defaultValue="scopes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scopes">Phân công nhân sự</TabsTrigger>
          <TabsTrigger value="mappings">Sơ đồ quản lý</TabsTrigger>
          <TabsTrigger value="roles">Vai trò & tỷ lệ</TabsTrigger>
        </TabsList>

        <TabsContent value="scopes">
          <ScopeTab
            items={scopes}
            loading={scopesLoading}
            roles={roles}
            regions={regions}
            provinces={provinces}
            employeeMap={employeeMap}
            roleMap={roleMap}
            regionMap={regionMap}
            provinceMap={provinceMap}
          />
        </TabsContent>
        <TabsContent value="mappings">
          <MappingTab
            items={mappings}
            loading={mappingsLoading}
            period={period}
            regions={regions}
            provinces={provinces}
            employeeMap={employeeMap}
            regionMap={regionMap}
            provinceMap={provinceMap}
          />
        </TabsContent>
        <TabsContent value="roles">
          <RoleRateTab items={roles} rates={rates} loading={ratesLoading} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SummaryCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Card className="rounded-lg py-4 shadow-none">
      <CardContent className="flex items-center justify-between gap-3 px-4">
        <div>
          <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
          <div className="mt-1 text-xl font-bold tabular-nums">{value}</div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-50 text-teal-700">{icon}</div>
      </CardContent>
    </Card>
  )
}

function ScopeTab({
  items,
  loading,
  roles,
  regions,
  provinces,
  employeeMap,
  roleMap,
  regionMap,
  provinceMap,
}: {
  items: EmployeeScopeItem[]
  loading: boolean
  roles: SalaryRoleItem[]
  regions: { id: number; code: string; name: string }[]
  provinces: { id: number; code: string; name: string }[]
  employeeMap: Map<number, string>
  roleMap: Map<number, string>
  regionMap: Map<number, string>
  provinceMap: Map<number, string>
}) {
  const [editing, setEditing] = useState<EmployeeScopeItem | null | undefined>()

  return (
    <Panel
      title="Phân công nhân sự"
      description="Khai báo nhân viên giữ vai trò lương nào, phụ trách vùng/tỉnh nào và thời gian hiệu lực."
      action={<Button onClick={() => setEditing(null)}><Plus className="mr-2 h-4 w-4" /> Thêm phân công</Button>}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nhân viên</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead>Vùng</TableHead>
            <TableHead>Tỉnh</TableHead>
            <TableHead>Hiệu lực</TableHead>
            <TableHead>Chỉ tiêu</TableHead>
            <TableHead className="w-24 text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <EmptyRow colSpan={7} text="Đang tải phân công..." />
          ) : items.length === 0 ? (
            <EmptyRow colSpan={7} text="Chưa có phân công nhân sự" />
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{employeeMap.get(item.employee_id) ?? `#${item.employee_id}`}</TableCell>
                <TableCell>{roleMap.get(item.role_id) ?? item.role_id}</TableCell>
                <TableCell>{item.region_id ? regionMap.get(item.region_id) : "-"}</TableCell>
                <TableCell>{item.province_id ? provinceMap.get(item.province_id) : "-"}</TableCell>
                <TableCell>{item.effective_from} → {item.effective_to ?? "hiện tại"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {item.is_personal_target ? <Badge variant="secondary">Cá nhân</Badge> : null}
                    {item.is_manager_target ? <Badge variant="outline">Quản lý</Badge> : null}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <RowButtons onEdit={() => setEditing(item)} onDelete={() => deleteWithConfirm("Xóa phân công này?", () => deleteEmployeeScope(item.id), ["salary-setup-scopes"])} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <ScopeDialog open={editing !== undefined} item={editing ?? null} roles={roles} regions={regions} provinces={provinces} onOpenChange={(open) => !open && setEditing(undefined)} />
    </Panel>
  )
}

function MappingTab({
  items,
  loading,
  period,
  regions,
  provinces,
  employeeMap,
  regionMap,
  provinceMap,
}: {
  items: ManagerMappingItem[]
  loading: boolean
  period: string
  regions: { id: number; code: string; name: string }[]
  provinces: { id: number; code: string; name: string }[]
  employeeMap: Map<number, string>
  regionMap: Map<number, string>
  provinceMap: Map<number, string>
}) {
  const [editing, setEditing] = useState<ManagerMappingItem | null | undefined>()

  return (
    <Panel
      title="Sơ đồ quản lý"
      description="Khai báo Sale thuộc ASM/RM nào trong kỳ. Bảng này là nguồn để tính Quỹ vùng RM."
      action={<Button onClick={() => setEditing(null)}><Plus className="mr-2 h-4 w-4" /> Thêm mapping</Button>}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kỳ</TableHead>
            <TableHead>Sale</TableHead>
            <TableHead>ASM</TableHead>
            <TableHead>RM</TableHead>
            <TableHead>Vùng</TableHead>
            <TableHead>Tỉnh</TableHead>
            <TableHead className="w-24 text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <EmptyRow colSpan={7} text="Đang tải sơ đồ quản lý..." />
          ) : items.length === 0 ? (
            <EmptyRow colSpan={7} text="Chưa có mapping quản lý" />
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell><Badge variant="outline">{prettyPeriod(item.period)}</Badge></TableCell>
                <TableCell className="font-medium">{employeeMap.get(item.sales_employee_id) ?? `#${item.sales_employee_id}`}</TableCell>
                <TableCell>{item.asm_employee_id ? (employeeMap.get(item.asm_employee_id) ?? `#${item.asm_employee_id}`) : "-"}</TableCell>
                <TableCell>{item.rm_employee_id ? (employeeMap.get(item.rm_employee_id) ?? `#${item.rm_employee_id}`) : "-"}</TableCell>
                <TableCell>{item.region_id ? regionMap.get(item.region_id) : "-"}</TableCell>
                <TableCell>{item.province_id ? provinceMap.get(item.province_id) : "-"}</TableCell>
                <TableCell className="text-right">
                  <RowButtons onEdit={() => setEditing(item)} onDelete={() => deleteWithConfirm("Xóa mapping này?", () => deleteManagerMapping(item.id), ["salary-setup-mappings"])} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <MappingDialog open={editing !== undefined} item={editing ?? null} period={period} regions={regions} provinces={provinces} onOpenChange={(open) => !open && setEditing(undefined)} />
    </Panel>
  )
}

function RoleRateTab({ items, rates, loading }: { items: SalaryRoleItem[]; rates: RoleRateItem[]; loading: boolean }) {
  const [roleEdit, setRoleEdit] = useState<SalaryRoleItem | null | undefined>()
  const [rateEdit, setRateEdit] = useState<RoleRateItem | null | undefined>()
  const roleMap = useMemo(() => new Map(items.map((item) => [item.id, `${item.code} - ${item.name}`])), [items])

  return (
    <div className="space-y-4">
      <Panel
        title="Vai trò lương"
        description="Danh mục vai trò nghiệp vụ dùng riêng cho module lương, tách khỏi role phân quyền hệ thống."
        action={<Button onClick={() => setRoleEdit(null)}><Plus className="mr-2 h-4 w-4" /> Thêm vai trò</Button>}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Tên vai trò</TableHead>
              <TableHead>Ghi chú</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-24 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-semibold">{item.code}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell className="text-muted-foreground">{item.description ?? "-"}</TableCell>
                <TableCell>{item.status === 1 ? <Badge>Đang dùng</Badge> : <Badge variant="secondary">Tắt</Badge>}</TableCell>
                <TableCell className="text-right">
                  <RowButtons onEdit={() => setRoleEdit(item)} onDelete={() => deleteWithConfirm("Xóa vai trò lương này?", () => deleteSalaryRole(item.id), ["salary-setup-roles"])} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>

      <Panel
        title="Tỷ lệ vai trò"
        description="Tỷ lệ hưởng lương/thưởng theo vai trò. RM vùng dùng tỷ lệ MGR_REGION để tính Quỹ vùng RM."
        action={<Button onClick={() => setRateEdit(null)}><Plus className="mr-2 h-4 w-4" /> Thêm tỷ lệ</Button>}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vai trò</TableHead>
              <TableHead className="text-right">Tỷ lệ lương</TableHead>
              <TableHead className="text-right">Tỷ lệ thưởng</TableHead>
              <TableHead className="text-right">Lương CB</TableHead>
              <TableHead className="text-right">Phụ cấp</TableHead>
              <TableHead>Hiệu lực</TableHead>
              <TableHead className="w-24 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <EmptyRow colSpan={7} text="Đang tải tỷ lệ..." />
            ) : rates.length === 0 ? (
              <EmptyRow colSpan={7} text="Chưa có tỷ lệ vai trò" />
            ) : (
              rates.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{roleMap.get(item.role_id) ?? item.role_id}</TableCell>
                  <TableCell className="text-right">{moneyPct(item.salary_rate)}</TableCell>
                  <TableCell className="text-right">{moneyPct(item.bonus_rate)}</TableCell>
                  <TableCell className="text-right">{moneyPct(item.basic_salary_rate)}</TableCell>
                  <TableCell className="text-right">{moneyPct(item.allowance_rate)}</TableCell>
                  <TableCell>{item.effective_from} → {item.effective_to ?? "hiện tại"}</TableCell>
                  <TableCell className="text-right">
                    <RowButtons onEdit={() => setRateEdit(item)} onDelete={() => deleteWithConfirm("Xóa tỷ lệ này?", () => deleteRoleRate(item.id), ["salary-setup-rates"])} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Panel>

      <RoleDialog open={roleEdit !== undefined} item={roleEdit ?? null} onOpenChange={(open) => !open && setRoleEdit(undefined)} />
      <RateDialog open={rateEdit !== undefined} item={rateEdit ?? null} roles={items} onOpenChange={(open) => !open && setRateEdit(undefined)} />
    </div>
  )
}

function Panel({ title, description, action, children }: { title: string; description: string; action: ReactNode; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}

function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-8 text-center text-muted-foreground">{text}</TableCell>
    </TableRow>
  )
}

function RowButtons({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="icon" onClick={onEdit}><Pencil className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
    </div>
  )
}

function deleteWithConfirm(message: string, fn: () => Promise<unknown>, queryKey: unknown[]) {
  if (!window.confirm(message)) return
  fn()
    .then(() => {
      toast.success("Đã xóa")
      window.dispatchEvent(new CustomEvent("salary-setup-refresh", { detail: queryKey }))
    })
    .catch((error: Error) => toast.error(error.message))
}

function useSalarySetupRefresh() {
  const qc = useQueryClient()
  useEffect(() => {
    const handler = (event: Event) => {
      const queryKey = (event as CustomEvent<unknown[]>).detail
      qc.invalidateQueries({ queryKey })
    }
    window.addEventListener("salary-setup-refresh", handler)
    return () => window.removeEventListener("salary-setup-refresh", handler)
  }, [qc])
}

function ScopeDialog({ open, onOpenChange, item, roles, regions, provinces }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: EmployeeScopeItem | null
  roles: SalaryRoleItem[]
  regions: { id: number; code: string; name: string }[]
  provinces: { id: number; code: string; name: string }[]
}) {
  useSalarySetupRefresh()
  const qc = useQueryClient()
  const isEdit = !!item
  const [employeeId, setEmployeeId] = useState("")
  const [roleId, setRoleId] = useState("")
  const [regionId, setRegionId] = useState(EMPTY)
  const [provinceId, setProvinceId] = useState(EMPTY)
  const [personal, setPersonal] = useState("1")
  const [manager, setManager] = useState("0")
  const [from, setFrom] = useState(today())
  const [to, setTo] = useState("")

  useEffect(() => {
    if (!open) return
    setEmployeeId(item?.employee_id ? String(item.employee_id) : "")
    setRoleId(item?.role_id ? String(item.role_id) : "")
    setRegionId(item?.region_id ? String(item.region_id) : EMPTY)
    setProvinceId(item?.province_id ? String(item.province_id) : EMPTY)
    setPersonal(String(item?.is_personal_target ?? 1))
    setManager(String(item?.is_manager_target ?? 0))
    setFrom(item?.effective_from ?? today())
    setTo(item?.effective_to ?? "")
  }, [open, item])

  const mutation = useMutation({
    mutationFn: () => {
      const body = {
        employee_id: Number(employeeId),
        role_id: Number(roleId),
        region_id: regionId === EMPTY ? null : Number(regionId),
        province_id: provinceId === EMPTY ? null : Number(provinceId),
        is_personal_target: Number(personal),
        is_manager_target: Number(manager),
        effective_from: from,
        effective_to: to || null,
        status: 1,
      }
      return isEdit ? updateEmployeeScope(item!.id, body) : createEmployeeScope(body)
    },
    onSuccess: () => {
      toast.success(isEdit ? "Đã cập nhật phân công" : "Đã tạo phân công")
      qc.invalidateQueries({ queryKey: ["salary-setup-scopes"] })
      onOpenChange(false)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Sửa phân công nhân sự" : "Thêm phân công nhân sự"}</DialogTitle>
          <DialogDescription>Phân công này quyết định nhân viên tham gia tính lương theo vai trò/vùng/tỉnh nào.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Nhân viên" required>
            <AsyncSelect value={employeeId ? Number(employeeId) : undefined} onChange={(value: number | undefined) => setEmployeeId(value ? String(value) : "")} dataSource={employeeDataSource()} mapOption={employeeOption} placeholder="Chọn nhân viên" searchPlaceholder="Tìm mã hoặc tên nhân viên..." required />
          </Field>
          <Field label="Vai trò lương" required>
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Chọn vai trò" /></SelectTrigger>
              <SelectContent>{roles.map((role) => <SelectItem key={role.id} value={String(role.id)}>{role.code} - {role.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Vùng phụ trách">
            <Select value={regionId} onValueChange={setRegionId}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={EMPTY}>Không chọn vùng</SelectItem>{regions.map((region) => <SelectItem key={region.id} value={String(region.id)}>{region.code} - {region.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Tỉnh phụ trách">
            <Select value={provinceId} onValueChange={setProvinceId}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={EMPTY}>Không chọn tỉnh</SelectItem>{provinces.map((province) => <SelectItem key={province.id} value={String(province.id)}>{province.code} - {province.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Loại chỉ tiêu">
            <div className="grid gap-3 sm:grid-cols-2">
              <Select value={personal} onValueChange={setPersonal}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="1">Có chỉ tiêu cá nhân</SelectItem><SelectItem value="0">Không có chỉ tiêu cá nhân</SelectItem></SelectContent>
              </Select>
              <Select value={manager} onValueChange={setManager}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="1">Có chỉ tiêu quản lý</SelectItem><SelectItem value="0">Không có chỉ tiêu quản lý</SelectItem></SelectContent>
              </Select>
            </div>
          </Field>
          <Field label="Từ ngày" required><Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></Field>
          <Field label="Tới ngày"><Input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button disabled={!employeeId || !roleId || !from || mutation.isPending} onClick={() => mutation.mutate()}>{isEdit ? "Cập nhật" : "Thêm"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function MappingDialog({ open, onOpenChange, item, period, regions, provinces }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: ManagerMappingItem | null
  period: string
  regions: { id: number; code: string; name: string }[]
  provinces: { id: number; code: string; name: string }[]
}) {
  useSalarySetupRefresh()
  const qc = useQueryClient()
  const isEdit = !!item
  const [formPeriod, setFormPeriod] = useState(period)
  const [saleId, setSaleId] = useState("")
  const [asmId, setAsmId] = useState("")
  const [rmId, setRmId] = useState("")
  const [regionId, setRegionId] = useState(EMPTY)
  const [provinceId, setProvinceId] = useState(EMPTY)

  useEffect(() => {
    if (!open) return
    setFormPeriod(item?.period ? prettyPeriod(item.period) : period)
    setSaleId(item?.sales_employee_id ? String(item.sales_employee_id) : "")
    setAsmId(item?.asm_employee_id ? String(item.asm_employee_id) : "")
    setRmId(item?.rm_employee_id ? String(item.rm_employee_id) : "")
    setRegionId(item?.region_id ? String(item.region_id) : EMPTY)
    setProvinceId(item?.province_id ? String(item.province_id) : EMPTY)
  }, [open, item, period])

  const mutation = useMutation({
    mutationFn: () => {
      const body = {
        period: compactPeriod(formPeriod),
        sales_employee_id: Number(saleId),
        asm_employee_id: asmId ? Number(asmId) : null,
        rm_employee_id: rmId ? Number(rmId) : null,
        region_id: regionId === EMPTY ? null : Number(regionId),
        province_id: provinceId === EMPTY ? null : Number(provinceId),
      }
      return isEdit ? updateManagerMapping(item!.id, body) : createManagerMapping(body)
    },
    onSuccess: () => {
      toast.success(isEdit ? "Đã cập nhật mapping" : "Đã tạo mapping")
      qc.invalidateQueries({ queryKey: ["salary-setup-mappings"] })
      onOpenChange(false)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Sửa sơ đồ quản lý" : "Thêm sơ đồ quản lý"}</DialogTitle>
          <DialogDescription>Dữ liệu này cho biết Sale thuộc ASM/RM nào trong kỳ, dùng trực tiếp để tính Quỹ vùng RM.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Kỳ áp dụng"><SalaryPeriodStepper className="w-full" value={formPeriod} onChange={setFormPeriod} /></Field>
          <Field label="Sale" required><AsyncSelect value={saleId ? Number(saleId) : undefined} onChange={(value: number | undefined) => setSaleId(value ? String(value) : "")} dataSource={employeeDataSource()} mapOption={employeeOption} placeholder="Chọn Sale" searchPlaceholder="Tìm Sale..." required /></Field>
          <Field label="ASM quản lý"><AsyncSelect value={asmId ? Number(asmId) : undefined} onChange={(value: number | undefined) => setAsmId(value ? String(value) : "")} dataSource={employeeDataSource()} mapOption={employeeOption} placeholder="Không có ASM" searchPlaceholder="Tìm ASM..." /></Field>
          <Field label="RM vùng"><AsyncSelect value={rmId ? Number(rmId) : undefined} onChange={(value: number | undefined) => setRmId(value ? String(value) : "")} dataSource={employeeDataSource()} mapOption={employeeOption} placeholder="Không có RM" searchPlaceholder="Tìm RM..." /></Field>
          <Field label="Vùng">
            <Select value={regionId} onValueChange={setRegionId}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={EMPTY}>Không chọn vùng</SelectItem>{regions.map((region) => <SelectItem key={region.id} value={String(region.id)}>{region.code} - {region.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Tỉnh">
            <Select value={provinceId} onValueChange={setProvinceId}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={EMPTY}>Không chọn tỉnh</SelectItem>{provinces.map((province) => <SelectItem key={province.id} value={String(province.id)}>{province.code} - {province.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button disabled={!saleId || mutation.isPending} onClick={() => mutation.mutate()}>{isEdit ? "Cập nhật" : "Thêm"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RoleDialog({ open, onOpenChange, item }: { open: boolean; onOpenChange: (open: boolean) => void; item: SalaryRoleItem | null }) {
  useSalarySetupRefresh()
  const qc = useQueryClient()
  const isEdit = !!item
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("1")

  useEffect(() => {
    if (!open) return
    setCode(item?.code ?? "")
    setName(item?.name ?? "")
    setDescription(item?.description ?? "")
    setStatus(String(item?.status ?? 1))
  }, [open, item])

  const mutation = useMutation({
    mutationFn: () => {
      const body = { code, name, type: "SALARY", description: description || null, status: Number(status) }
      return isEdit ? updateSalaryRole(item!.id, body) : createSalaryRole(body)
    },
    onSuccess: () => {
      toast.success(isEdit ? "Đã cập nhật vai trò" : "Đã tạo vai trò")
      qc.invalidateQueries({ queryKey: ["salary-setup-roles"] })
      onOpenChange(false)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader><DialogTitle>{isEdit ? "Sửa vai trò lương" : "Thêm vai trò lương"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Field label="Mã vai trò" required><Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="MGR_REGION" /></Field>
          <Field label="Tên vai trò" required><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="RM vùng" /></Field>
          <Field label="Trạng thái"><Select value={status} onValueChange={setStatus}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">Đang dùng</SelectItem><SelectItem value="0">Tắt</SelectItem></SelectContent></Select></Field>
          <Field label="Ghi chú"><Textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} /></Field>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button><Button disabled={!code || !name || mutation.isPending} onClick={() => mutation.mutate()}>{isEdit ? "Cập nhật" : "Thêm"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RateDialog({ open, onOpenChange, item, roles }: { open: boolean; onOpenChange: (open: boolean) => void; item: RoleRateItem | null; roles: SalaryRoleItem[] }) {
  useSalarySetupRefresh()
  const qc = useQueryClient()
  const isEdit = !!item
  const [roleId, setRoleId] = useState("")
  const [salaryRate, setSalaryRate] = useState("")
  const [bonusRate, setBonusRate] = useState("")
  const [basicRate, setBasicRate] = useState("")
  const [allowanceRate, setAllowanceRate] = useState("")
  const [from, setFrom] = useState(today())
  const [to, setTo] = useState("")

  useEffect(() => {
    if (!open) return
    setRoleId(item?.role_id ? String(item.role_id) : "")
    setSalaryRate(item?.salary_rate != null ? String(item.salary_rate * 100) : "")
    setBonusRate(item?.bonus_rate != null ? String(item.bonus_rate * 100) : "")
    setBasicRate(item?.basic_salary_rate != null ? String(item.basic_salary_rate * 100) : "")
    setAllowanceRate(item?.allowance_rate != null ? String(item.allowance_rate * 100) : "")
    setFrom(item?.effective_from ?? today())
    setTo(item?.effective_to ?? "")
  }, [open, item])

  const mutation = useMutation({
    mutationFn: () => {
      const body = {
        role_id: Number(roleId),
        salary_rate: toRate(salaryRate),
        bonus_rate: toRate(bonusRate),
        basic_salary_rate: toRate(basicRate),
        allowance_rate: toRate(allowanceRate),
        effective_from: from,
        effective_to: to || null,
        status: 1,
      }
      return isEdit ? updateRoleRate(item!.id, body) : createRoleRate(body)
    },
    onSuccess: () => {
      toast.success(isEdit ? "Đã cập nhật tỷ lệ" : "Đã tạo tỷ lệ")
      qc.invalidateQueries({ queryKey: ["salary-setup-rates"] })
      onOpenChange(false)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Sửa tỷ lệ vai trò" : "Thêm tỷ lệ vai trò"}</DialogTitle>
          <DialogDescription>Nhập theo phần trăm. Ví dụ 20 nghĩa là 20% và lưu xuống DB là 0.2.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Vai trò" required><Select value={roleId} onValueChange={setRoleId}><SelectTrigger className="w-full"><SelectValue placeholder="Chọn vai trò" /></SelectTrigger><SelectContent>{roles.map((role) => <SelectItem key={role.id} value={String(role.id)}>{role.code} - {role.name}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Tỷ lệ lương (%)" required><Input value={salaryRate} onChange={(event) => setSalaryRate(event.target.value)} /></Field>
          <Field label="Tỷ lệ thưởng (%)" required><Input value={bonusRate} onChange={(event) => setBonusRate(event.target.value)} /></Field>
          <Field label="Tỷ lệ vào lương cơ bản (%)" required><Input value={basicRate} onChange={(event) => setBasicRate(event.target.value)} /></Field>
          <Field label="Tỷ lệ vào phụ cấp (%)" required><Input value={allowanceRate} onChange={(event) => setAllowanceRate(event.target.value)} /></Field>
          <Field label="Từ ngày" required><Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></Field>
          <Field label="Tới ngày"><Input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></Field>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button><Button disabled={!roleId || !from || mutation.isPending} onClick={() => mutation.mutate()}>{isEdit ? "Cập nhật" : "Thêm"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
