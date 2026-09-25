import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  Target,
  UserRoundCheck,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  createGrowthTask,
  getGrowthDashboard,
  updateGrowthTask,
  type GrowthOpportunity,
  type GrowthTask,
} from "@/api/ai/chat";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const typeLabels: Record<GrowthOpportunity["type"], string> = {
  REACTIVATE: "Kích hoạt lại",
  RECOVER_DECLINE: "Phục hồi doanh số",
  REORDER_DUE: "Đến chu kỳ nhập",
  CROSS_SELL: "Bán thêm",
};

function money(value: number) {
  if (!Number.isFinite(value)) return "0 đồng";
  if (Math.abs(value) >= 1_000_000_000)
    return `${(value / 1_000_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} tỷ đồng`;
  if (Math.abs(value) >= 1_000_000)
    return `${(value / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} triệu đồng`;
  return `${value.toLocaleString("vi-VN")} đồng`;
}

function shortDate(value?: string | null) {
  if (!value) return "Chưa có";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function GrowthAdvisor({
  onAnalyze,
}: {
  onAnalyze: (prompt: string) => void;
}) {
  const queryClient = useQueryClient();
  const [assigning, setAssigning] = useState<GrowthOpportunity | null>(null);
  const [employeeId, setEmployeeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [actualRevenue, setActualRevenue] = useState<Record<number, string>>(
    {},
  );
  const [taskView, setTaskView] = useState<"opportunities" | "tasks">(
    "opportunities",
  );
  const query = useQuery({
    queryKey: ["growth-dashboard"],
    queryFn: getGrowthDashboard,
    staleTime: 5 * 60_000,
  });
  const createTask = useMutation({
    mutationFn: createGrowthTask,
    onSuccess: () => {
      toast.success("Đã giao việc và đưa vào danh sách theo dõi");
      setAssigning(null);
      void queryClient.invalidateQueries({ queryKey: ["growth-dashboard"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const updateTask = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number;
      status: GrowthTask["status"];
    }) => updateGrowthTask(id, { status }),
    onSuccess: () => {
      toast.success("Đã cập nhật công việc");
      void queryClient.invalidateQueries({ queryKey: ["growth-dashboard"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const dashboard = query.data;
  const assignedKeys = useMemo(
    () =>
      new Set(
        (dashboard?.tasks ?? [])
          .filter((task) => task.status !== "DONE")
          .map((task) => task.opportunity_key),
      ),
    [dashboard?.tasks],
  );

  const startAssigning = (item: GrowthOpportunity) => {
    const matched = dashboard?.employees.find(
      (employee) => employee.code === item.saleCode,
    );
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    setEmployeeId(matched ? String(matched.id) : "");
    setDueDate(nextWeek.toISOString().slice(0, 10));
    setAssigning(item);
  };

  if (query.isLoading)
    return (
      <div className="flex min-h-72 items-center justify-center gap-3 text-sm text-muted-foreground">
        <LoaderCircle className="size-5 animate-spin" /> Đang tính cơ hội từ dữ
        liệu kinh doanh…
      </div>
    );

  if (query.isError || !dashboard)
    return (
      <Alert variant="destructive">
        <AlertTitle>Chưa tải được bảng điều hành tăng trưởng</AlertTitle>
        <AlertDescription className="mt-2 flex items-center justify-between gap-3">
          <span>{query.error?.message ?? "Vui lòng thử lại."}</span>
          <Button variant="outline" size="sm" onClick={() => query.refetch()}>
            <RefreshCw className="size-4" /> Tải lại
          </Button>
        </AlertDescription>
      </Alert>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge className="rounded-full">Điều hành tăng trưởng</Badge>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Việc nào giúp bán thêm ngay?
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Tính trực tiếp từ dữ liệu đến ngày {shortDate(dashboard.asOfDate)}.
            Giao đúng người, theo dõi đến khi có kết quả.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => query.refetch()}>
          <RefreshCw
            className={cn("size-4", query.isFetching && "animate-spin")}
          />
          Làm mới
        </Button>
      </div>

      {dashboard.dataLagDays > 2 && (
        <Alert>
          <CalendarClock className="size-4" />
          <AlertTitle>
            Dữ liệu bán hàng chậm {dashboard.dataLagDays} ngày
          </AlertTitle>
          <AlertDescription>
            Cần cập nhật dữ liệu trước khi dùng con số này để giao chỉ tiêu.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={CircleDollarSign}
          label="Doanh thu tháng này"
          value={money(dashboard.summary.monthRevenue)}
          note={`${dashboard.summary.growthPercent >= 0 ? "+" : ""}${dashboard.summary.growthPercent}% so với cùng số ngày tháng trước`}
        />
        <Metric
          icon={Target}
          label="Cơ hội đang phát hiện"
          value={money(dashboard.summary.estimatedOpportunityRevenue)}
          note={`${dashboard.opportunities.length} cơ hội có thể hành động`}
        />
        <Metric
          icon={UserRoundCheck}
          label="Việc đang thực hiện"
          value={String(dashboard.summary.activeTasks)}
          note="Có người phụ trách và hạn hoàn thành"
        />
        <Metric
          icon={CheckCircle2}
          label="Việc đã hoàn thành"
          value={String(dashboard.summary.completedTasks)}
          note={`Đã ghi nhận ${money(dashboard.summary.realizedRevenue)}`}
        />
      </div>

      <div className="flex gap-2 border-b">
        <TabButton
          active={taskView === "opportunities"}
          onClick={() => setTaskView("opportunities")}
        >
          Cơ hội ưu tiên ({dashboard.opportunities.length})
        </TabButton>
        <TabButton
          active={taskView === "tasks"}
          onClick={() => setTaskView("tasks")}
        >
          Công việc đã giao ({dashboard.tasks.length})
        </TabButton>
      </div>

      {taskView === "opportunities" ? (
        <div className="space-y-3">
          {dashboard.opportunities.map((item, index) => {
            const alreadyAssigned = assignedKeys.has(item.key);
            return (
              <Card
                key={item.key}
                className="overflow-hidden border-border/70 shadow-none"
              >
                <CardContent className="p-0">
                  <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-5">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {index + 1}
                        </span>
                        <Badge variant="secondary" className="rounded-full">
                          {typeLabels[item.type]}
                        </Badge>
                        {item.priority === "HIGH" && (
                          <Badge className="rounded-full bg-amber-500 text-white hover:bg-amber-500">
                            Ưu tiên cao
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold leading-6">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                      <div className="mt-3 grid gap-x-6 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">
                        <span>
                          Sale hiện tại:{" "}
                          <b className="text-foreground">
                            {item.saleName || "Chưa xác định"}
                          </b>
                        </span>
                        <span>
                          Lần mua gần nhất:{" "}
                          <b className="text-foreground">
                            {shortDate(item.lastPurchaseDate)}
                          </b>
                        </span>
                      </div>
                      <div className="mt-3 rounded-lg bg-muted/60 px-3 py-2.5 text-sm leading-6">
                        <b>Việc đề xuất:</b> {item.suggestedAction}
                      </div>
                    </div>
                    <div className="flex min-w-44 flex-col items-stretch justify-between gap-3 sm:items-end">
                      <div className="sm:text-right">
                        <p className="text-xs text-muted-foreground">
                          Doanh thu có thể phục hồi
                        </p>
                        <p className="mt-1 text-lg font-semibold text-primary">
                          {money(item.estimatedRevenue)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            onAnalyze(
                              `Phân tích sâu cơ hội ${item.title} (${item.entityCode}). Kiểm tra doanh thu, sản phẩm thường mua, công nợ và đề xuất cách liên hệ cụ thể.`,
                            )
                          }
                        >
                          <Sparkles className="size-4" /> Phân tích sâu
                        </Button>
                        <Button
                          size="sm"
                          disabled={alreadyAssigned}
                          onClick={() => startAssigning(item)}
                        >
                          <UserRoundCheck className="size-4" />
                          {alreadyAssigned ? "Đã giao" : "Giao việc"}
                        </Button>
                      </div>
                    </div>
                  </div>
                  {assigning?.key === item.key && (
                    <div className="grid gap-3 border-t bg-muted/30 p-4 sm:grid-cols-[1fr_180px_auto] sm:items-end">
                      <label className="grid gap-1.5 text-xs font-medium">
                        Người phụ trách
                        <select
                          className="h-10 rounded-md border bg-background px-3 text-sm"
                          value={employeeId}
                          onChange={(event) =>
                            setEmployeeId(event.target.value)
                          }
                        >
                          <option value="">Chọn nhân viên</option>
                          {dashboard.employees.map((employee) => (
                            <option key={employee.id} value={employee.id}>
                              {employee.name} · {employee.code}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1.5 text-xs font-medium">
                        Hạn hoàn thành
                        <input
                          type="date"
                          className="h-10 rounded-md border bg-background px-3 text-sm"
                          value={dueDate}
                          onChange={(event) => setDueDate(event.target.value)}
                        />
                      </label>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => setAssigning(null)}
                        >
                          Hủy
                        </Button>
                        <Button
                          disabled={
                            !employeeId || !dueDate || createTask.isPending
                          }
                          onClick={() =>
                            createTask.mutate({
                              opportunityKey: item.key,
                              opportunityType: item.type,
                              entityCode: item.entityCode,
                              title: item.title,
                              description: item.suggestedAction,
                              assigneeEmployeeId: Number(employeeId),
                              dueDate,
                              estimatedRevenue: item.estimatedRevenue,
                            })
                          }
                        >
                          Xác nhận giao
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {dashboard.opportunities.length === 0 && (
            <p className="rounded-xl border bg-background p-6 text-center text-sm text-muted-foreground">
              Chưa phát hiện cơ hội đủ điều kiện từ dữ liệu hiện tại.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {dashboard.tasks.map((task) => (
            <Card key={task.id} className="shadow-none">
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={task.status === "DONE" ? "secondary" : "default"}
                    >
                      {task.status === "DONE"
                        ? "Đã hoàn thành"
                        : task.status === "IN_PROGRESS"
                          ? "Đang thực hiện"
                          : "Chưa bắt đầu"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Hạn {shortDate(task.due_date)}
                    </span>
                  </div>
                  <h3 className="mt-2 font-semibold">{task.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {task.assignee_name || "Chưa giao người phụ trách"} · Giá
                    trị dự kiến {money(task.estimated_revenue)}
                  </p>
                </div>
                {task.status !== "DONE" && (
                  <div className="flex flex-wrap items-end gap-2 sm:justify-end">
                    {task.status === "OPEN" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateTask.mutate({
                            id: task.id,
                            status: "IN_PROGRESS",
                          })
                        }
                      >
                        Bắt đầu
                      </Button>
                    )}
                    <label className="grid gap-1 text-[11px] text-muted-foreground">
                      Doanh thu thực tế
                      <input
                        inputMode="numeric"
                        className="h-8 w-36 rounded-md border bg-background px-2 text-sm text-foreground"
                        placeholder="Không bắt buộc"
                        value={actualRevenue[task.id] ?? ""}
                        onChange={(event) =>
                          setActualRevenue((current) => ({
                            ...current,
                            [task.id]: event.target.value.replace(
                              /[^0-9]/g,
                              "",
                            ),
                          }))
                        }
                      />
                    </label>
                    <Button
                      size="sm"
                      onClick={() =>
                        updateGrowthTask(task.id, {
                          status: "DONE",
                          actualRevenue: actualRevenue[task.id]
                            ? Number(actualRevenue[task.id])
                            : undefined,
                        })
                          .then(() => {
                            toast.success("Đã hoàn thành và ghi nhận kết quả");
                            void queryClient.invalidateQueries({
                              queryKey: ["growth-dashboard"],
                            });
                          })
                          .catch((error: Error) => toast.error(error.message))
                      }
                    >
                      <CheckCircle2 className="size-4" /> Hoàn thành
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {dashboard.tasks.length === 0 && (
            <p className="rounded-xl border bg-background p-6 text-center text-sm text-muted-foreground">
              Chưa có công việc nào được giao từ cơ hội tăng trưởng.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <Card className="border-border/70 shadow-none">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Icon className="size-4 text-primary" /> {label}
        </div>
        <p className="mt-3 text-xl font-semibold tracking-tight">{value}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border-b-2 px-1 pb-3 text-sm font-medium transition-colors",
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
