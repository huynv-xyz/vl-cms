import { apiDelete, apiGet, apiPost, apiPut } from "@/api/client";

export type AiChatRequest = {
  message: string;
  conversation_id?: number;
};

export type AiSource = {
  report_id: string;
  label: string;
  from_date: string;
  to_date: string;
  generated_at: string;
};

export type AiChatResponse = {
  answer: string;
  sources: AiSource[];
  warnings: string[];
  charts: AiChart[];
  request_id: string;
  conversation_id: number;
};

export type AiChart = {
  id: string;
  title: string;
  unit: string;
  points: Array<{
    label: string;
    from_date: string;
    to_date: string;
    net_revenue?: number | null;
    return_revenue?: number | null;
    debit_amount?: number | null;
    credit_amount?: number | null;
    net_amount?: number | null;
    value?: number | null;
    secondary_value?: number | null;
  }>;
};

export function sendAiMessage(input: AiChatRequest) {
  return apiPost<AiChatResponse>("/ai/chat", input);
}

export type AiFeedbackRating = "USEFUL" | "NOT_USEFUL";

export function sendAiFeedback(input: {
  request_id: string;
  rating: AiFeedbackRating;
  reason_code?: string;
  comment?: string;
}) {
  return apiPost<{ request_id: string }>("/ai/feedback", input);
}

export type AiConversation = {
  id: number;
  title: string;
  message_count: number;
  created_at: string;
  updated_at: string;
};

export type AiStoredMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  artifact_json?: string | null;
  created_at: string;
};

export const listAiConversations = () =>
  apiGet<AiConversation[]>("/ai/conversations");
export const createAiConversation = (title = "Hội thoại mới") =>
  apiPost<{ id: number }>("/ai/conversations", { title });
export const getAiConversationMessages = (id: number) =>
  apiGet<AiStoredMessage[]>(`/ai/conversations/${id}/messages`);
export const renameAiConversation = (id: number, title: string) =>
  apiPut<{ id: number }>(`/ai/conversations/${id}`, { title });
export const deleteAiConversation = (id: number) =>
  apiDelete<{ id: number }>(`/ai/conversations/${id}`);

export type GrowthOpportunity = {
  key: string;
  type: "REACTIVATE" | "RECOVER_DECLINE" | "REORDER_DUE" | "CROSS_SELL";
  entityCode: string;
  entityName: string;
  title: string;
  description: string;
  estimatedRevenue: number;
  saleCode?: string | null;
  saleName?: string | null;
  lastPurchaseDate?: string | null;
  suggestedAction: string;
  priority: "HIGH" | "MEDIUM";
  evidence: Record<string, string | number | null>;
};

export type GrowthTask = {
  id: number;
  opportunity_key: string;
  opportunity_type: string;
  entity_code?: string | null;
  title: string;
  description?: string | null;
  assignee_employee_id?: number | null;
  assignee_code?: string | null;
  assignee_name?: string | null;
  due_date?: string | null;
  estimated_revenue: number;
  actual_revenue?: number | null;
  status: "OPEN" | "IN_PROGRESS" | "DONE";
};

export type GrowthRankingItem = {
  code: string;
  name: string;
  netRevenue: number;
  saleQuantity: number;
  returnRevenue: number;
  returnRatePercent: number;
};

export type GrowthDashboard = {
  asOfDate: string;
  currentFrom: string;
  previousFrom: string;
  previousTo: string;
  dataLagDays: number;
  tokenUsage: number;
  summary: {
    monthRevenue: number;
    previousComparableRevenue: number;
    growthPercent: number;
    estimatedOpportunityRevenue: number;
    activeTasks: number;
    completedTasks: number;
    realizedRevenue: number;
  };
  operations: {
    fromDate: string;
    toDate: string;
    netRevenue: number;
    returnRevenue: number;
    totalOrders: number;
    openOrders: number;
    overdueOrders: number;
    receivableBalance: number;
    shipmentsInTransit: number;
    expiringLots: number;
    salesDataThrough: string;
    orderDataThrough: string;
    receivableDataThrough: string;
  };
  salesTrend: Array<{
    fromDate: string;
    toDate: string;
    grossRevenue: number;
    returnRevenue: number;
    netRevenue: number;
  }>;
  topRegions: GrowthRankingItem[];
  topEmployees: GrowthRankingItem[];
  topProductGroups: GrowthRankingItem[];
  topCustomers: GrowthRankingItem[];
  profitability: {
    summary: {
      totalRows: number;
      coveredRows: number;
      returnRows: number;
      netRevenue: number;
      coveredNetRevenue: number;
      estimatedCost: number;
      estimatedProfitOnCoveredRows: number;
      incompleteMonths: string[];
    };
    totalGroups: number;
    incompleteGroups: number;
    items: Array<{
      code: string;
      name: string;
      netRevenue: number;
      coveredNetRevenue: number;
      estimatedProfit?: number | null;
      estimatedPercent?: number | null;
      assessment: string;
    }>;
  };
  salesTargets: Array<{
    employee_code: string;
    employee_name: string;
    target_amount: number;
    actual_amount: number;
    variance_amount: number;
    completion_percent?: number | null;
  }>;
  marketCoverage: Array<{
    region: string;
    total_customers: number;
    active_customers: number;
    assigned_customers: number;
    revenue_90_days: number;
  }>;
  topReceivables: Array<{
    customerCode: string;
    customerName: string;
    debitAmount: number;
    creditAmount: number;
    balance: number;
  }>;
  inventoryRisks: Array<{
    riskType: "NEGATIVE_STOCK" | "EXPIRED" | "EXPIRING_SOON";
    productCode: string;
    productName: string;
    warehouseName?: string | null;
    lotCode?: string | null;
    quantity: number;
    unit?: string | null;
    expiryDate?: string | null;
    daysToExpiry?: number | null;
  }>;
  newCustomers: Array<{
    customer_code: string;
    customer_name: string;
    region?: string | null;
    assigned_employee_name?: string | null;
    first_purchase_date: string;
    net_revenue: number;
  }>;
  inactiveCustomers: Array<{
    customer_code: string;
    customer_name: string;
    region?: string | null;
    employee_name?: string | null;
    last_purchase_date?: string | null;
    inactive_days?: number | null;
    revenue_last_12_months: number;
  }>;
  vipInactiveCustomers: Array<{
    customer_code: string;
    customer_name: string;
    vip_tier: string;
    region?: string | null;
    employee_name?: string | null;
    last_purchase_date?: string | null;
    inactive_days?: number | null;
    net_revenue_last_12_months: number;
  }>;
  deliveryPerformance: Array<{
    employee_code: string;
    employee_name: string;
    total_orders: number;
    delivered_orders: number;
    on_time_orders: number;
    late_orders: number;
    pending_orders: number;
    on_time_percent?: number | null;
  }>;
  opportunities: GrowthOpportunity[];
  tasks: GrowthTask[];
  employees: Array<{ id: number; code: string; name: string }>;
};

export const getGrowthDashboard = () =>
  apiGet<GrowthDashboard>("/ai/growth/dashboard");

export const createGrowthTask = (input: {
  opportunityKey: string;
  opportunityType: string;
  entityCode: string;
  title: string;
  description: string;
  assigneeEmployeeId?: number;
  dueDate?: string;
  estimatedRevenue: number;
}) => apiPost<{ id: number }>("/ai/growth/tasks", input);

export const updateGrowthTask = (
  id: number,
  input: { status: GrowthTask["status"]; actualRevenue?: number },
) => apiPut<{ id: number }>(`/ai/growth/tasks/${id}`, input);
