import { apiGet, apiPut } from "@/api/client";

export type AiAdminSummary = {
  requests: number;
  successful: number;
  failed: number;
  cache_hits: number;
  openai_requests: number;
  success_rate: number;
  cache_hit_rate: number;
  input_tokens: number;
  cached_input_tokens: number;
  billable_input_tokens: number;
  output_tokens: number;
  average_input_tokens: number;
  average_output_tokens: number;
  estimated_cost_usd: number;
  pricing_coverage_rate: number;
  feedback_count: number;
  useful_feedback: number;
  not_useful_feedback: number;
  useful_rate: number;
};

export type AiDailyUsage = {
  date: string;
  requests: number;
  successful: number;
  failed: number;
  input_tokens: number;
  cached_input_tokens: number;
  output_tokens: number;
  estimated_cost_usd: number;
};

export type AiModelUsage = {
  model: string;
  requests: number;
  successful: number;
  failed: number;
  cache_hits: number;
  input_tokens: number;
  cached_input_tokens: number;
  output_tokens: number;
  openai_requests: number;
  average_duration_ms: number;
  max_duration_ms: number;
  pricing_configured: boolean;
  estimated_cost_usd: number;
};

export type AiPricing = {
  model: string;
  input_usd_per_million: number;
  cached_input_usd_per_million: number;
  output_usd_per_million: number;
  updated_at: string;
};

export type AiRecentRequest = {
  request_id: string;
  created_at: string;
  status: string;
  error_code?: string | null;
  model?: string | null;
  tool_names?: string | null;
  input_tokens?: number | null;
  cached_input_tokens?: number | null;
  output_tokens?: number | null;
  duration_ms: number;
  offered_tool_count?: number | null;
  tool_payload_chars?: number | null;
  openai_request_count?: number | null;
  cache_status?: string | null;
  user_name?: string | null;
  user_email?: string | null;
  rating?: "USEFUL" | "NOT_USEFUL" | null;
  reason_code?: string | null;
  comment?: string | null;
  question_preview?: string | null;
  answer_preview?: string | null;
};

export type AiAdminAnalytics = {
  from_date: string;
  to_date: string;
  summary: AiAdminSummary;
  daily: AiDailyUsage[];
  models: AiModelUsage[];
  tools: Array<{ tool: string; requests: number }>;
  errors: Array<{ error_code: string; count: number }>;
  feedback_reasons: Array<{ reason_code: string; count: number }>;
  pricing: AiPricing[];
};

export type AiRequestPage = {
  items: AiRecentRequest[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
};

export function getAiAdminAnalytics(fromDate: string, toDate: string) {
  return apiGet<AiAdminAnalytics>("/ai/admin/analytics", {
    from_date: fromDate,
    to_date: toDate,
  });
}

export function getAiAdminRequests(fromDate: string, toDate: string, page: number, size: number) {
  return apiGet<AiRequestPage>("/ai/admin/requests", {
    from_date: fromDate,
    to_date: toDate,
    page,
    size,
  });
}

export function updateAiModelPricing(
  model: string,
  input: {
    input_usd_per_million: number;
    cached_input_usd_per_million: number;
    output_usd_per_million: number;
  },
) {
  return apiPut<{ model: string }>(`/ai/admin/pricing/${encodeURIComponent(model)}`, input);
}
