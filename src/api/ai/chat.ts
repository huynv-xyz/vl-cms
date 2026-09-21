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
