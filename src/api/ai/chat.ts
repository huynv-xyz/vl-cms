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
