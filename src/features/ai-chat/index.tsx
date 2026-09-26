import { useMemo, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Bot,
  Boxes,
  Check,
  ClipboardCheck,
  TrendingDown,
  Clock3,
  Copy,
  Database,
  ExternalLink,
  LayoutDashboard,
  MessageSquarePlus,
  PackageCheck,
  Send,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  Truck,
  Trash2,
  User,
  WalletCards,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  deleteAiConversation,
  getAiConversationMessages,
  listAiConversations,
  sendAiMessage,
  sendAiFeedback,
  type AiChatResponse,
} from "@/api/ai/chat";
import { getMyPermissions } from "@/api/auth/permission";
import { Main } from "@/components/layout/main";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { GrowthAdvisor } from "./growth-advisor";

type UserMessage = {
  id: string;
  role: "user";
  content: string;
};

type AssistantMessage = {
  id: string;
  role: "assistant";
  content: string;
  result: AiChatResponse;
};

type ChatMessage = UserMessage | AssistantMessage;

type Suggestion = {
  title: string;
  prompt: string;
  description: string;
  icon: typeof TrendingUp;
  tone: string;
};

type PromptCategory =
  | "executive"
  | "sales"
  | "orders"
  | "receivables"
  | "inventory"
  | "shipments"
  | "production"
  | "purchasing"
  | "vip";

type PromptSuggestion = Suggestion & {
  keywords: string;
  category: PromptCategory;
};

const MAX_MESSAGE_LENGTH = 2000;
const overviewCategoryOrder: PromptCategory[] = [
  "executive",
  "sales",
  "receivables",
  "orders",
  "inventory",
  "shipments",
  "vip",
  "production",
  "purchasing",
];
function createChatMessageId() {
  const browserCrypto = globalThis.crypto;
  if (typeof browserCrypto?.randomUUID === "function") {
    return browserCrypto.randomUUID();
  }

  if (typeof browserCrypto?.getRandomValues === "function") {
    const bytes = browserCrypto.getRandomValues(new Uint32Array(4));
    return Array.from(bytes, (value) =>
      value.toString(16).padStart(8, "0"),
    ).join("-");
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export default function AiChatPage({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<
    number | null
  >(null);
  const [showOverview, setShowOverview] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [composerFocused, setComposerFocused] = useState(false);
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const permissionsQuery = useQuery({
    queryKey: ["my-permissions"],
    queryFn: getMyPermissions,
  });
  const conversationsQuery = useQuery({
    queryKey: ["ai-conversations"],
    queryFn: listAiConversations,
  });
  const storedMessagesQuery = useQuery({
    queryKey: ["ai-conversation-messages", activeConversationId],
    queryFn: () => getAiConversationMessages(activeConversationId!),
    enabled: activeConversationId !== null && !showOverview,
  });

  const storedMessages = useMemo(
    () =>
      (storedMessagesQuery.data ?? []).map((item): ChatMessage => {
        if (item.role === "user")
          return { id: String(item.id), role: "user", content: item.content };
        let result: AiChatResponse;
        try {
          result = JSON.parse(item.artifact_json ?? "{}");
        } catch {
          result = {} as AiChatResponse;
        }
        const normalizedResult = normalizeStoredResult(result);
        return {
          id: String(item.id),
          role: "assistant",
          content: item.content,
          result: {
            answer: item.content,
            sources: normalizedResult.sources,
            warnings: normalizedResult.warnings,
            charts: normalizedResult.charts,
            request_id: normalizedResult.request_id ?? String(item.id),
            conversation_id: activeConversationId!,
          },
        };
      }),
    [storedMessagesQuery.data, activeConversationId],
  );
  const displayMessages = messages.length > 0 ? messages : storedMessages;
  const activeConversation = (conversationsQuery.data ?? []).find(
    (conversation) => conversation.id === activeConversationId,
  );

  const suggestions = useMemo(() => {
    const permissions = new Set(
      (permissionsQuery.data ?? []).map(
        (item) => `${item.module}.${item.action}`,
      ),
    );
    const values: Suggestion[] = [];
    if (permissions.has("ai.sales.view")) {
      values.push(
        {
          title: "Doanh thu theo khách hàng",
          prompt:
            "Tổng hợp doanh thu theo khách hàng tháng này, sắp xếp từ cao xuống thấp và kèm tỷ suất lợi nhuận",
          description: "Doanh thu, lợi nhuận và tỷ suất",
          icon: User,
          tone: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
        },
        {
          title: "Doanh thu theo nhóm hàng",
          prompt:
            "Tổng hợp doanh thu theo nhóm hàng tháng này, sắp xếp từ cao xuống thấp",
          description: "So sánh các nhóm sản phẩm",
          icon: Boxes,
          tone: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
        },
        {
          title: "Doanh thu theo nhân viên",
          prompt:
            "Tổng hợp doanh thu theo nhân viên sale tháng này, sắp xếp từ cao xuống thấp",
          description: "Xếp hạng đội ngũ bán hàng",
          icon: User,
          tone: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
        },
        {
          title: "Doanh thu theo vùng",
          prompt:
            "Tổng hợp doanh thu theo vùng tháng này, sắp xếp từ cao xuống thấp",
          description: "So sánh hiệu quả từng vùng",
          icon: BarChart3,
          tone: "bg-teal-500/10 text-teal-700 dark:text-teal-300",
        },
        {
          title: "Dữ liệu cần sửa",
          prompt:
            "Liệt kê chứng từ tháng này thiếu hoặc không khớp giá vốn, ưu tiên doanh thu lớn và chỉ rõ nhân viên cần đối chiếu gì",
          description: "Chứng từ, vấn đề và cách xử lý",
          icon: ClipboardCheck,
          tone: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
        },
        {
          title: "Biên lợi nhuận thấp",
          prompt:
            "Những mặt hàng nào có chênh lệch doanh thu so giá vốn dưới 10% trong tháng trước? Ưu tiên mặt hàng doanh thu lớn và đề xuất việc cần kiểm tra",
          description: "Phát hiện sớm, đối chiếu đúng",
          icon: BarChart3,
          tone: "bg-teal-500/10 text-teal-700 dark:text-teal-300",
        },
        {
          title: "Khách hàng giảm mua",
          prompt:
            "Khách hàng nào giảm doanh thu ít nhất 20% trong tháng trước so với kỳ liền trước cùng số ngày? Ưu tiên số tiền giảm và đề xuất chăm sóc",
          description: "So sánh hai kỳ, ưu tiên chăm sóc",
          icon: TrendingDown,
          tone: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
        },
      );
      values.push({
        title: "Phân tích doanh thu",
        prompt:
          "Phân tích doanh thu tháng này, so sánh kỳ trước và nêu các điểm đáng chú ý",
        description: "Xu hướng, so sánh và hàng trả lại",
        icon: TrendingUp,
        tone: "bg-teal-500/10 text-teal-700 dark:text-teal-300",
      });
      values.push({
        title: "Top sản phẩm",
        prompt: "Top 10 sản phẩm có doanh thu cao nhất tháng này là gì?",
        description: "Xếp hạng theo doanh thu thuần",
        icon: BarChart3,
        tone: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
      });
    }
    if (permissions.has("ai.executive.view"))
      values.unshift({
        title: "Tổng quan điều hành",
        prompt:
          "Tổng quan tình hình kinh doanh tháng này và các vấn đề cần chú ý",
        description: "KPI chính và cảnh báo ưu tiên",
        icon: Sparkles,
        tone: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
      });
    if (permissions.has("purchasing.shipments.view"))
      values.push({
        title: "Lịch hàng về",
        prompt: "Trong 30 ngày tới có những lô hàng nào dự kiến về?",
        description: "Shipment, ETA và nhà cung cấp",
        icon: Truck,
        tone: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
      });
    if (permissions.has("inventory.inbounds.view"))
      values.push({
        title: "Rủi ro tồn kho",
        prompt: "Có tồn kho âm hoặc lô hàng sắp hết hạn không?",
        description: "Tồn âm, hết hạn và cận hạn",
        icon: Boxes,
        tone: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
      });
    if (permissions.has("ai.receivables.view")) {
      values.push({
        title: "Công nợ khách hàng",
        prompt:
          "Top 10 khách hàng đang có dư công nợ lớn nhất và nhận định rủi ro",
        description: "Dư nợ và khách hàng cần theo dõi",
        icon: WalletCards,
        tone: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
      });
    }
    return values;
  }, [permissionsQuery.data]);

  const promptCatalog = useMemo<PromptSuggestion[]>(() => {
    const permissions = new Set(
      (permissionsQuery.data ?? []).map(
        (item) => `${item.module}.${item.action}`,
      ),
    );
    const items: PromptSuggestion[] = suggestions
      .filter((item) =>
        [
          "Dữ liệu cần sửa",
          "Biên lợi nhuận thấp",
          "Khách hàng giảm mua",
        ].includes(item.title),
      )
      .map((item) => ({
        ...item,
        category: "sales",
        keywords: `${item.title} ${item.prompt} gia von loi nhuan du lieu thieu khach giam mua`,
      }));
    const add = (
      category: PromptCategory,
      title: string,
      prompt: string,
      description: string,
      icon: Suggestion["icon"],
      tone: string,
      keywords = "",
    ) =>
      items.push({
        category,
        title,
        prompt,
        description,
        icon,
        tone,
        keywords: `${title} ${description} ${prompt} ${keywords}`,
      });

    if (permissions.has("ai.executive.view")) {
      add(
        "executive",
        "Tổng quan điều hành",
        "Tổng quan tình hình kinh doanh tháng này và các vấn đề cần chú ý",
        "KPI chính và cảnh báo ưu tiên",
        Sparkles,
        "bg-violet-500/10 text-violet-700 dark:text-violet-300",
        "tong hop bao cao dieu hanh",
      );
      add(
        "executive",
        "Tình hình hôm nay",
        "Tóm tắt tình hình kinh doanh hôm nay và các việc cần ưu tiên xử lý",
        "Bản tin nhanh cho lãnh đạo",
        LayoutDashboard,
        "bg-violet-500/10 text-violet-700 dark:text-violet-300",
        "hom nay giao ban",
      );
      add(
        "executive",
        "Chuẩn bị họp giao ban",
        "Lập bản tóm tắt phục vụ họp giao ban: KPI chính, biến động và các vấn đề cần quyết định",
        "KPI, biến động và hành động",
        ShieldCheck,
        "bg-slate-500/10 text-slate-700 dark:text-slate-300",
        "hop giao ban quyet dinh",
      );
    }
    if (permissions.has("ai.sales.view")) {
      add(
        "sales",
        "Doanh thu hôm nay",
        "Doanh thu hôm nay là bao nhiêu? Phân tích doanh thu gộp, thuần và hàng trả lại",
        "Gộp, thuần và trả lại",
        TrendingUp,
        "bg-teal-500/10 text-teal-700",
        "ban hang ngay",
      );
      add(
        "sales",
        "Doanh thu tuần này",
        "Phân tích doanh thu tuần này và so sánh với tuần trước",
        "Xu hướng và biến động tuần",
        TrendingUp,
        "bg-teal-500/10 text-teal-700",
        "so sanh tuan truoc",
      );
      add(
        "sales",
        "Doanh thu tháng này",
        "Phân tích chi tiết doanh thu tháng này, chia theo tuần và so sánh kỳ trước",
        "Biểu đồ tuần và kỳ trước",
        BarChart3,
        "bg-teal-500/10 text-teal-700",
        "thang xu huong chart",
      );
      add(
        "sales",
        "Doanh thu quý này",
        "Phân tích doanh thu quý này tính đến hôm nay và so sánh với kỳ trước",
        "Tiến độ doanh thu theo quý",
        BarChart3,
        "bg-teal-500/10 text-teal-700",
        "quy quarter",
      );
      add(
        "sales",
        "Hàng trả lại",
        "Phân tích giá trị và tỷ lệ hàng trả lại tháng này, so sánh với kỳ trước",
        "Tỷ lệ trả hàng và biến động",
        PackageCheck,
        "bg-amber-500/10 text-amber-700",
        "tra lai doanh thu gop ty le",
      );
      add(
        "sales",
        "Top sản phẩm",
        "Top 10 sản phẩm có doanh thu thuần cao nhất tháng này và tỷ trọng từng sản phẩm",
        "Xếp hạng theo doanh thu thuần",
        BarChart3,
        "bg-blue-500/10 text-blue-700",
        "mat hang san pham ban chay",
      );
      add(
        "sales",
        "Top khách hàng",
        "Top 10 khách hàng có doanh thu cao nhất tháng này và tỷ trọng đóng góp",
        "Khách hàng đóng góp doanh thu",
        User,
        "bg-blue-500/10 text-blue-700",
        "khach mua nhieu",
      );
      add(
        "sales",
        "Top nhân viên",
        "Xếp hạng nhân viên theo doanh thu thuần tháng này",
        "Hiệu quả đội ngũ bán hàng",
        User,
        "bg-indigo-500/10 text-indigo-700",
        "sale nhan vien hieu suat",
      );
      add(
        "sales",
        "Doanh thu theo khu vực",
        "Phân tích doanh thu tháng này theo khu vực và xếp hạng từ cao xuống thấp",
        "So sánh hiệu quả khu vực",
        BarChart3,
        "bg-cyan-500/10 text-cyan-700",
        "vung mien dia ban",
      );
      add(
        "sales",
        "Khách B2B và B2C",
        "So sánh doanh thu khách hàng B2B và B2C tháng này",
        "Cơ cấu theo loại khách hàng",
        BarChart3,
        "bg-cyan-500/10 text-cyan-700",
        "loai khach hang co cau",
      );
      add(
        "orders",
        "Đơn hàng hôm nay",
        "Hôm nay có bao nhiêu đơn hàng và trạng thái xử lý như thế nào?",
        "Đơn mới, xác nhận và hoàn thành",
        PackageCheck,
        "bg-indigo-500/10 text-indigo-700",
        "don hang hom nay trang thai xu ly",
      );
      add(
        "orders",
        "Đơn hàng tháng này",
        "Thống kê số lượng và giá trị đơn hàng tháng này theo trạng thái",
        "Số đơn, giá trị và trạng thái",
        PackageCheck,
        "bg-indigo-500/10 text-indigo-700",
        "don ban hang",
      );
      add(
        "orders",
        "Đơn cần xử lý",
        "Liệt kê các đơn hàng chưa giao hoặc đang quá hạn cần xử lý, ưu tiên đơn nghiêm trọng",
        "Đơn tồn và giao hàng quá hạn",
        Truck,
        "bg-orange-500/10 text-orange-700",
        "chua giao qua han cham giao",
      );
      add(
        "sales",
        "Sale phụ trách khách hàng",
        "Mỗi nhân viên sale đang phụ trách những khách hàng nào? Tổng hợp số khách theo sale và nêu khách chưa phân công",
        "Phân công và độ phủ khách hàng",
        User,
        "bg-indigo-500/10 text-indigo-700",
        "nhan vien phu trach quan ly khach",
      );
      add(
        "sales",
        "Sai lệch phân công sale",
        "Kiểm tra các đơn hàng thiếu sale hoặc sale trên đơn khác nhân viên phụ trách khách hàng",
        "Ngoại lệ dữ liệu cần xử lý",
        AlertCircle,
        "bg-orange-500/10 text-orange-700",
        "don thieu sale sai phan cong",
      );
      add(
        "sales",
        "KPI đội ngũ sale",
        "Phân tích tỷ lệ hoàn thành chỉ tiêu của từng nhân viên sale năm nay, nêu top và người cần hỗ trợ",
        "Mục tiêu so với thực hiện",
        TrendingUp,
        "bg-indigo-500/10 text-indigo-700",
        "target actual chi tieu",
      );
      add(
        "sales",
        "Khách hàng ngừng mua",
        "Liệt kê khách hàng không mua trong 90 ngày gần đây và sale đang phụ trách",
        "Danh sách cần tái chăm sóc",
        User,
        "bg-amber-500/10 text-amber-700",
        "inactive lau khong mua cham soc lai",
      );
      add(
        "orders",
        "Hiệu suất giao hàng",
        "Phân tích tỷ lệ giao đúng hạn, giao trễ và đơn đang chờ theo nhân viên sale tháng này",
        "Chất lượng thực hiện đơn",
        Truck,
        "bg-cyan-500/10 text-cyan-700",
        "delivery giao tre dung han",
      );
    }
    if (permissions.has("ai.receivables.view")) {
      add(
        "receivables",
        "Tổng quan công nợ",
        "Tổng quan công nợ khách hàng đến hôm nay và các rủi ro cần chú ý",
        "Dư lũy kế và cảnh báo",
        WalletCards,
        "bg-rose-500/10 text-rose-700",
        "phai thu du no",
      );
      add(
        "receivables",
        "Phát sinh công nợ",
        "Phân tích phát sinh công nợ tháng này theo tuần",
        "Nợ, Có và chênh lệch",
        WalletCards,
        "bg-rose-500/10 text-rose-700",
        "no co theo tuan chart",
      );
      add(
        "receivables",
        "Top khách hàng nợ",
        "Top 10 khách hàng có dư công nợ lớn nhất đến hôm nay và nhận định rủi ro",
        "Khách hàng cần theo dõi",
        User,
        "bg-rose-500/10 text-rose-700",
        "du no phai thu khach no",
      );
      add(
        "receivables",
        "Biến động công nợ",
        "So sánh phát sinh công nợ tháng này với kỳ trước và nêu biến động đáng chú ý",
        "So sánh Nợ, Có và chênh lệch",
        TrendingUp,
        "bg-rose-500/10 text-rose-700",
        "tang giam so sanh",
      );
    }
    if (permissions.has("inventory.inbounds.view")) {
      add(
        "inventory",
        "Rủi ro tồn kho",
        "Kiểm tra tồn kho âm, lô đã hết hạn và lô sắp hết hạn trong 30 ngày",
        "Tồn âm, hết hạn và cận hạn",
        Boxes,
        "bg-amber-500/10 text-amber-700",
        "canh bao kho lo han su dung",
      );
      add(
        "inventory",
        "Tồn kho âm",
        "Liệt kê các sản phẩm đang tồn kho âm và mức độ cần xử lý",
        "Sai lệch tồn kho cần kiểm tra",
        AlertCircle,
        "bg-red-500/10 text-red-700",
        "am kho so luong",
      );
      add(
        "inventory",
        "Lô sắp hết hạn",
        "Liệt kê các lô hàng sẽ hết hạn trong 30 ngày tới, sắp xếp theo ngày hết hạn",
        "Ưu tiên xử lý hàng cận hạn",
        Clock3,
        "bg-amber-500/10 text-amber-700",
        "expiry han su dung 30 ngay",
      );
      add(
        "inventory",
        "Hàng đã nhập tuần này",
        "Tuần này đã thực nhập những mặt hàng nào, số lượng bao nhiêu?",
        "Mặt hàng đã vào kho thực tế",
        PackageCheck,
        "bg-emerald-500/10 text-emerald-700",
        "inbound nhap kho thuc nhap",
      );
      add(
        "inventory",
        "Tồn kho hiện tại",
        "Top sản phẩm có lượng tồn kho lớn nhất hiện nay, chi tiết theo kho",
        "Số lượng tồn theo sản phẩm và kho",
        Boxes,
        "bg-amber-500/10 text-amber-700",
        "ton hien tai hang trong kho",
      );
    }
    if (permissions.has("purchasing.shipments.view")) {
      add(
        "shipments",
        "Hàng về tuần này",
        "Tuần này có những lô hàng nào dự kiến về? Cho biết ETA, nhà cung cấp và trạng thái",
        "Lịch ETA trong tuần",
        Truck,
        "bg-cyan-500/10 text-cyan-700",
        "shipment lo hang sap ve",
      );
      add(
        "shipments",
        "Hàng về 30 ngày tới",
        "Trong 30 ngày tới có những lô hàng nào dự kiến về?",
        "Shipment, ETA và nhà cung cấp",
        Truck,
        "bg-cyan-500/10 text-cyan-700",
        "lich nhap khau",
      );
      add(
        "shipments",
        "Hàng đang đi",
        "Các shipment đang đi hiện nay gồm những lô nào, ETA và nhà cung cấp là gì?",
        "Theo dõi lô đang vận chuyển",
        Truck,
        "bg-cyan-500/10 text-cyan-700",
        "in transit van chuyen",
      );
      add(
        "purchasing",
        "Hiệu suất nhà cung cấp",
        "Phân tích nhà cung cấp theo số shipment, tình trạng giao trễ và tỷ lệ hàng lỗi năm nay",
        "Giao trễ và chất lượng hàng",
        Truck,
        "bg-cyan-500/10 text-cyan-700",
        "supplier nha cung cap defect loi",
      );
    }
    if (permissions.has("vip.customer.view")) {
      add(
        "vip",
        "Khách hàng theo hạng",
        "Thống kê số lượng khách hàng VIP theo từng hạng năm nay",
        "Kim Cương, Vàng, Bạc và thành viên",
        Sparkles,
        "bg-violet-500/10 text-violet-700",
        "phan hang tier",
      );
      add(
        "vip",
        "Khách VIP Kim Cương",
        "Có bao nhiêu khách hàng hạng Kim Cương năm nay? Liệt kê chi tiết khách hàng",
        "Số lượng và danh sách khách",
        Sparkles,
        "bg-violet-500/10 text-violet-700",
        "diamond bach kim vang bac",
      );
      add(
        "vip",
        "Khách gần lên hạng",
        "Top khách hàng còn thiếu ít điểm nhất để lên hạng VIP tiếp theo năm nay",
        "Điểm thiếu và sale phụ trách",
        TrendingUp,
        "bg-violet-500/10 text-violet-700",
        "missing point thieu diem len hang",
      );
    }
    if (permissions.has("production.orders.view")) {
      add(
        "production",
        "Tiến độ sản xuất",
        "Phân tích tiến độ các lệnh sản xuất tháng này và cảnh báo thiếu nguyên liệu",
        "Kế hoạch, hoàn thành và thiếu hụt",
        Boxes,
        "bg-emerald-500/10 text-emerald-700",
        "lenh san xuat nguyen lieu shortage",
      );
    }
    return Array.from(
      new Map(items.map((item) => [item.prompt, item])).values(),
    );
  }, [permissionsQuery.data, suggestions]);

  const overviewSuggestions = useMemo(() => {
    const byCategory = new Map<PromptCategory, PromptSuggestion[]>();
    promptCatalog.forEach((suggestion) => {
      const items = byCategory.get(suggestion.category) ?? [];
      items.push(suggestion);
      byCategory.set(suggestion.category, items);
    });

    const selected: PromptSuggestion[] = [];
    for (let round = 0; selected.length < 12; round += 1) {
      let foundSuggestion = false;
      overviewCategoryOrder.forEach((category) => {
        const suggestion = byCategory.get(category)?.[round];
        if (suggestion && selected.length < 12) {
          selected.push(suggestion);
          foundSuggestion = true;
        }
      });
      if (!foundSuggestion) break;
    }
    return selected;
  }, [promptCatalog]);

  const lastUserQuestion = useMemo(
    () =>
      [...displayMessages].reverse().find((message) => message.role === "user")
        ?.content ?? "",
    [displayMessages],
  );
  const contextualCategories = useMemo(
    () => detectPromptCategories(lastUserQuestion),
    [lastUserQuestion],
  );

  const contextualPromptSuggestions = useMemo(
    () =>
      [...promptCatalog]
        .filter(
          (item) =>
            normalizeSearch(item.prompt) !== normalizeSearch(lastUserQuestion),
        )
        .sort(
          (a, b) =>
            Number(contextualCategories.includes(b.category)) -
            Number(contextualCategories.includes(a.category)),
        )
        .slice(0, 8),
    [contextualCategories, lastUserQuestion, promptCatalog],
  );

  const matchedPromptSuggestions = useMemo(() => {
    const query = normalizeSearch(draft.trim());
    if (query.length < 2) return contextualPromptSuggestions;
    const words = query.split(/\s+/).filter(Boolean);
    return promptCatalog
      .map((item) => ({ item, searchable: normalizeSearch(item.keywords) }))
      .filter(({ searchable }) =>
        words.every((word) => searchable.includes(word)),
      )
      .sort(
        (a, b) =>
          Number(b.searchable.startsWith(query)) -
          Number(a.searchable.startsWith(query)),
      )
      .slice(0, 8)
      .map(({ item }) => item);
  }, [contextualPromptSuggestions, draft, promptCatalog]);

  const showPromptSuggestions =
    composerFocused &&
    !suggestionsDismissed &&
    matchedPromptSuggestions.length > 0;

  function choosePromptSuggestion(prompt: string) {
    setDraft(prompt);
    setSuggestionsDismissed(true);
    setActiveSuggestionIndex(-1);
  }

  const mutation = useMutation({
    mutationFn: sendAiMessage,
    onSuccess: (result) => {
      const safeResult: AiChatResponse = {
        ...result,
        sources: Array.isArray(result.sources) ? result.sources : [],
        warnings: Array.isArray(result.warnings) ? result.warnings : [],
        charts: Array.isArray(result.charts)
          ? result.charts.filter(
              (chart) => Array.isArray(chart.points) && chart.points.length > 0,
            )
          : [],
      };
      setMessages((current) => [
        ...current,
        {
          id: createChatMessageId(),
          role: "assistant",
          content: safeResult.answer,
          result: safeResult,
        },
      ]);
      setActiveConversationId(result.conversation_id);
      setShowOverview(false);
      void queryClient.invalidateQueries({ queryKey: ["ai-conversations"] });
      setDraft("");
      requestAnimationFrame(() =>
        bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      );
    },
  });

  function submit(message = draft) {
    const normalized = message.trim();
    if (!normalized) {
      setValidationError("Vui lòng nhập câu hỏi");
      return;
    }
    if (normalized.length > MAX_MESSAGE_LENGTH) {
      setValidationError("Câu hỏi tối đa 2.000 ký tự");
      return;
    }
    if (mutation.isPending) return;

    const conversationId = showOverview
      ? undefined
      : (activeConversationId ?? undefined);
    if (showOverview) {
      setActiveConversationId(null);
      setMessages([]);
    }
    setShowOverview(false);

    setValidationError(null);
    setMessages((current) => [
      ...(showOverview ? [] : current.length > 0 ? current : storedMessages),
      { id: createChatMessageId(), role: "user", content: normalized },
    ]);
    mutation.mutate({
      message: normalized,
      conversation_id: conversationId,
    });
    requestAnimationFrame(() =>
      bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
    );
  }

  function openConversation(id: number) {
    setActiveConversationId(id);
    setShowOverview(false);
    setShowGuide(false);
    setMessages([]);
    mutation.reset();
  }

  function newConversation() {
    setActiveConversationId(null);
    setShowOverview(false);
    setShowGuide(false);
    setMessages([]);
    setDraft("");
    mutation.reset();
  }

  const deleteMutation = useMutation({
    mutationFn: deleteAiConversation,
    onSuccess: () => {
      newConversation();
      void queryClient.invalidateQueries({ queryKey: ["ai-conversations"] });
    },
  });

  return (
    <Main
      fluid={embedded}
      className={cn(
        "flex w-full flex-col gap-0",
        embedded
          ? "h-full min-h-0 max-w-none overflow-hidden p-0"
          : "h-[calc(100dvh-4rem)] min-h-0 max-w-none overflow-hidden p-0",
      )}
    >
      <div
        className={cn(
          "items-start justify-between gap-4 border-b px-6 py-5",
          embedded ? "hidden" : "flex",
        )}
      >
        {!embedded && (
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="text-primary size-6" />
              <h1 className="text-2xl font-bold tracking-tight">
                Trợ lý điều hành
              </h1>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              Từ dữ liệu kinh doanh đến việc cần làm tiếp.
            </p>
          </div>
        )}
        {!embedded && displayMessages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            disabled={mutation.isPending}
            onClick={newConversation}
          >
            <MessageSquarePlus /> Hội thoại mới
          </Button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="hidden min-h-0 w-60 shrink-0 flex-col overflow-hidden border-r border-border/60 bg-muted/20 lg:flex">
          <div className="space-y-2 border-b p-4">
            <Button className="w-full justify-start" onClick={newConversation}>
              <MessageSquarePlus className="size-4" /> Hội thoại mới
            </Button>
            <Button
              variant="ghost"
              className={cn("w-full justify-start", showOverview && "bg-muted")}
              onClick={() => {
                setShowOverview(true);
                setShowGuide(false);
              }}
            >
              <LayoutDashboard className="size-4" /> Tổng quan trợ lý
            </Button>
            <Button
              variant="ghost"
              className={cn("w-full justify-start", showGuide && "bg-muted")}
              onClick={() => {
                setShowGuide(true);
                setShowOverview(false);
              }}
            >
              <BookOpen className="size-4" /> Hướng dẫn sử dụng
            </Button>
          </div>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
            <p className="text-muted-foreground px-2 py-2 text-[11px] font-semibold uppercase tracking-wider">
              Gần đây
            </p>
            {(conversationsQuery.data ?? []).map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => openConversation(conversation.id)}
                className={cn(
                  "w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted",
                  !showOverview &&
                    activeConversationId === conversation.id &&
                    "bg-primary/10 text-primary",
                )}
              >
                <span className="block truncate text-sm font-medium">
                  {conversation.title}
                </span>
                <span className="text-muted-foreground mt-1 block text-[10px]">
                  {conversation.message_count} tin nhắn ·{" "}
                  {formatRelativeDate(conversation.updated_at)}
                </span>
              </button>
            ))}
          </div>
          {!showOverview && activeConversationId && (
            <div className="border-t p-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => {
                  if (
                    window.confirm(
                      "Xóa hội thoại này? Thao tác không thể hoàn tác.",
                    )
                  )
                    deleteMutation.mutate(activeConversationId);
                }}
              >
                <Trash2 className="size-4" /> Xóa hội thoại
              </Button>
            </div>
          )}
        </aside>
        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex items-center gap-2 border-b bg-background px-3 py-2 lg:hidden">
            <Button
              variant="outline"
              size="icon"
              aria-label="Tổng quan trợ lý"
              onClick={() => {
                setShowOverview(true);
                setShowGuide(false);
              }}
            >
              <LayoutDashboard className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setShowGuide(true);
                setShowOverview(false);
              }}
              aria-label="Hướng dẫn sử dụng"
            >
              <BookOpen className="size-4" />
            </Button>
            <select
              className="h-9 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm"
              aria-label="Chọn hội thoại"
              value={
                showOverview
                  ? "overview"
                  : showGuide
                    ? "guide"
                    : (activeConversationId ?? "new")
              }
              onChange={(event) => {
                if (event.target.value === "overview") {
                  setShowOverview(true);
                  setShowGuide(false);
                } else if (event.target.value === "guide") {
                  setShowGuide(true);
                  setShowOverview(false);
                } else if (event.target.value === "new") newConversation();
                else openConversation(Number(event.target.value));
              }}
            >
              <option value="overview">Tổng quan trợ lý</option>
              <option value="guide">Hướng dẫn sử dụng</option>
              <option value="new">Hội thoại mới</option>
              {(conversationsQuery.data ?? []).map((conversation) => (
                <option key={conversation.id} value={conversation.id}>
                  {conversation.title}
                </option>
              ))}
            </select>
            <Button
              size="icon"
              aria-label="Hội thoại mới"
              onClick={newConversation}
            >
              <MessageSquarePlus className="size-4" />
            </Button>
          </div>
          <div
            className="min-h-0 w-full flex-1 overflow-x-hidden overflow-y-auto bg-muted/20 scroll-smooth"
            aria-live="polite"
          >
            <div
              className={cn(
                "mx-auto w-full space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-10",
                showOverview && "max-w-6xl",
                showGuide && "max-w-4xl",
              )}
            >
              {showOverview && (
                <div className="py-2 sm:py-4">
                  <GrowthAdvisor onAnalyze={(prompt) => submit(prompt)} />
                  {overviewSuggestions.length > 0 && (
                    <div className="mt-10 border-t pt-6">
                      <h3 className="text-base font-semibold">
                        Các phân tích khác
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Chỉ các nút dưới đây mới sử dụng AI khi sếp chủ động
                        chọn.
                      </p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {overviewSuggestions.slice(0, 6).map((suggestion) => (
                          <Button
                            key={suggestion.prompt}
                            variant="outline"
                            className="group h-auto min-h-20 justify-start whitespace-normal rounded-xl border-border/60 bg-background p-4 text-left shadow-none"
                            onClick={() => submit(suggestion.prompt)}
                            disabled={mutation.isPending}
                          >
                            <span className="min-w-0 flex-1">
                              <span className="font-semibold">
                                {suggestion.title}
                              </span>
                              <span className="mt-1 block text-xs font-normal leading-5 text-muted-foreground">
                                {suggestion.description}
                              </span>
                            </span>
                            <ArrowUpRight className="size-4 self-start text-muted-foreground" />
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="size-3.5" /> Chỉ truy cập dữ liệu
                    theo quyền của tài khoản
                  </div>
                </div>
              )}

              {showGuide && (
                <AssistantGuide
                  onAsk={(prompt) => {
                    newConversation();
                    setDraft(prompt);
                  }}
                />
              )}

              {!showOverview &&
                !showGuide &&
                displayMessages.length === 0 &&
                !mutation.isPending &&
                !storedMessagesQuery.isLoading && (
                  <div className="flex min-h-[45vh] flex-col items-center justify-center text-center">
                    <span className="bg-primary/10 text-primary mb-4 flex size-12 items-center justify-center rounded-xl">
                      <Bot className="size-6" />
                    </span>
                    <h2 className="text-lg font-semibold">
                      Bắt đầu một phân tích mới
                    </h2>
                    <p className="text-muted-foreground mt-2 max-w-md text-sm">
                      Đặt câu hỏi về doanh thu, công nợ, đơn hàng, tồn kho hoặc
                      lịch hàng về.
                    </p>
                  </div>
                )}

              {!showOverview && !showGuide && (
                <>
                  {displayMessages.map((message) =>
                    message.role === "user" ? (
                      <div
                        key={message.id}
                        className="flex justify-end gap-3 py-1"
                      >
                        <div className="bg-primary/10 text-foreground max-w-[88%] rounded-2xl rounded-tr-md px-5 py-3 text-sm leading-6 sm:max-w-[75%]">
                          {message.content}
                        </div>
                        <User className="bg-background size-9 shrink-0 rounded-xl border p-2 shadow-sm" />
                      </div>
                    ) : (
                      <AssistantBubble key={message.id} message={message} />
                    ),
                  )}

                  {displayMessages[displayMessages.length - 1]?.role ===
                    "assistant" &&
                    !mutation.isPending && (
                      <div className="ml-12 flex flex-wrap items-center gap-2">
                        <span className="text-muted-foreground mr-1 text-[11px] font-medium">
                          Có thể hỏi tiếp:
                        </span>
                        {contextualPromptSuggestions
                          .slice(0, 4)
                          .map((suggestion) => (
                            <Button
                              key={suggestion.prompt}
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 rounded-full bg-background px-3 text-[11px] font-normal shadow-sm"
                              onClick={() => submit(suggestion.prompt)}
                            >
                              <suggestion.icon className="size-3.5" />
                              {suggestion.title}
                            </Button>
                          ))}
                      </div>
                    )}

                  {mutation.isPending && (
                    <div className="flex items-start gap-3 py-1">
                      <span className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-xl shadow-sm">
                        <Bot className="size-4" />
                      </span>
                      <div className="rounded-2xl rounded-tl-md border bg-background px-5 py-4 text-sm shadow-sm">
                        <div className="flex items-center gap-3">
                          <span className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <span
                                key={i}
                                className="bg-primary/70 size-1.5 animate-pulse rounded-full"
                                style={{ animationDelay: `${i * 160}ms` }}
                              />
                            ))}
                          </span>
                          <span className="text-muted-foreground">
                            Đang truy vấn và phân tích dữ liệu…
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {mutation.isError && (
                    <Alert variant="destructive">
                      <AlertCircle />
                      <AlertTitle>Không thể trả lời câu hỏi</AlertTitle>
                      <AlertDescription>
                        <p>
                          {mutation.error instanceof Error
                            ? mutation.error.message
                            : "Đã có lỗi xảy ra."}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => mutation.reset()}
                        >
                          Đóng thông báo
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}
                  <div ref={bottomRef} />
                </>
              )}
            </div>
          </div>

          {!showGuide && (
            <div
              className="shrink-0 border-t bg-background/95 px-3 py-3 backdrop-blur sm:px-6 sm:py-4"
            >
              <div className="relative mx-auto w-full max-w-4xl min-w-0">
                {showPromptSuggestions && (
                  <div className="absolute right-0 bottom-[calc(100%+0.6rem)] left-0 z-30 overflow-hidden rounded-xl border bg-popover shadow-xl">
                    <div className="flex items-center justify-between border-b px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <span>
                        {draft.trim().length < 2
                          ? contextualCategories.length > 0
                            ? "Gợi ý theo nội dung đang trao đổi"
                            : "Câu hỏi phổ biến"
                          : "Kết quả gợi ý"}
                      </span>
                      <span className="font-normal normal-case tracking-normal">
                        {promptCatalog.length} chủ đề có thể tra cứu
                      </span>
                    </div>
                    <div className="max-h-80 overflow-y-auto p-1.5">
                      {matchedPromptSuggestions.map((suggestion, index) => (
                        <button
                          key={suggestion.prompt}
                          type="button"
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted",
                            activeSuggestionIndex === index && "bg-muted",
                          )}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            choosePromptSuggestion(suggestion.prompt);
                          }}
                        >
                          <span
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-lg",
                              suggestion.tone,
                            )}
                          >
                            <suggestion.icon className="size-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">
                              {suggestion.title}
                            </span>
                            <span className="text-muted-foreground block truncate text-xs">
                              {suggestion.prompt}
                            </span>
                          </span>
                          <span className="text-muted-foreground hidden text-[10px] sm:block">
                            Chọn
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div
                  className={cn(
                    "overflow-hidden rounded-2xl border border-border/80 bg-background shadow-[0_12px_38px_-22px_rgba(0,0,0,0.55)] transition-all focus-within:border-primary/40 focus-within:shadow-[0_16px_44px_-24px_hsl(var(--primary)/0.45)]",
                    validationError && "border-destructive/70",
                  )}
                >
                  <div className="flex items-center justify-between px-4 pt-3 pb-1">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-lg">
                        <Sparkles className="size-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold">
                          Hỏi dữ liệu VLife
                        </p>
                        <p className="text-muted-foreground truncate text-[10px]">
                          {activeConversation?.title ?? "Phân tích mới"}
                        </p>
                      </div>
                    </div>
                    <span className="text-muted-foreground hidden items-center gap-1.5 text-[10px] sm:flex">
                      <span className="size-1.5 rounded-full bg-emerald-500" />{" "}
                      Theo quyền truy cập
                    </span>
                  </div>
                  <div className="relative">
                    <Textarea
                      aria-label="Câu hỏi cho trợ lý điều hành"
                      value={draft}
                      maxLength={MAX_MESSAGE_LENGTH}
                      placeholder="Đặt câu hỏi hoặc yêu cầu phân tích, ví dụ: So sánh doanh thu tháng này với kỳ trước…"
                      className="min-h-20 max-h-40 w-full max-w-none resize-none border-0 bg-transparent px-4 py-3 text-sm leading-6 shadow-none focus-visible:ring-0 sm:min-h-24"
                      disabled={mutation.isPending}
                      onFocus={() => setComposerFocused(true)}
                      onBlur={() => setComposerFocused(false)}
                      onChange={(event) => {
                        setDraft(event.target.value);
                        setSuggestionsDismissed(false);
                        setActiveSuggestionIndex(-1);
                        if (validationError) setValidationError(null);
                      }}
                      onKeyDown={(event) => {
                        if (
                          showPromptSuggestions &&
                          event.key === "ArrowDown"
                        ) {
                          event.preventDefault();
                          setActiveSuggestionIndex(
                            (current) =>
                              (current + 1) % matchedPromptSuggestions.length,
                          );
                          return;
                        }
                        if (showPromptSuggestions && event.key === "ArrowUp") {
                          event.preventDefault();
                          setActiveSuggestionIndex((current) =>
                            current <= 0
                              ? matchedPromptSuggestions.length - 1
                              : current - 1,
                          );
                          return;
                        }
                        if (showPromptSuggestions && event.key === "Escape") {
                          event.preventDefault();
                          setSuggestionsDismissed(true);
                          setActiveSuggestionIndex(-1);
                          return;
                        }
                        if (
                          event.key === "Enter" &&
                          !event.shiftKey &&
                          !event.nativeEvent.isComposing
                        ) {
                          event.preventDefault();
                          if (
                            showPromptSuggestions &&
                            activeSuggestionIndex >= 0
                          ) {
                            choosePromptSuggestion(
                              matchedPromptSuggestions[activeSuggestionIndex]
                                .prompt,
                            );
                            return;
                          }
                          submit();
                        }
                      }}
                      aria-invalid={Boolean(validationError)}
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 bg-muted/10 px-3 py-2.5">
                    <div className="hidden items-center gap-1.5 md:flex">
                      {contextualPromptSuggestions
                        .slice(0, 3)
                        .map(({ title: label, prompt }) => (
                          <Button
                            key={prompt}
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground h-7 rounded-lg px-2.5 text-[11px] font-normal"
                            onClick={() => setDraft(prompt)}
                            disabled={mutation.isPending}
                          >
                            {label}
                          </Button>
                        ))}
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                      <span
                        className={cn(
                          "text-[10px]",
                          validationError
                            ? "text-destructive"
                            : "text-muted-foreground",
                        )}
                      >
                        {validationError ??
                          `${draft.length}/${MAX_MESSAGE_LENGTH}`}
                      </span>
                      <span className="text-muted-foreground hidden text-[10px] xl:inline">
                        Enter gửi · Shift+Enter xuống dòng
                      </span>
                      <Button
                        className="h-9 gap-2 rounded-xl px-3.5 shadow-sm"
                        disabled={mutation.isPending || !draft.trim()}
                        onClick={() => submit()}
                        aria-label="Gửi câu hỏi"
                      >
                        <Sparkles className="size-3.5" />
                        <span className="hidden sm:inline">Phân tích</span>
                        <Send className="size-3.5 sm:hidden" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </Main>
  );
}

const guideCapabilities = [
  {
    title: "Xem nhanh tình hình kinh doanh",
    description:
      "Biết doanh thu, số đơn hàng, công nợ và những việc cần chú ý trong một lần hỏi.",
    result: "Bản tóm tắt, số liệu chính, cảnh báo và biểu đồ khi phù hợp.",
    icon: BarChart3,
    tone: "bg-teal-500/10 text-teal-700",
    featuredPromptIndexes: [0, 2, 13, 18],
    prompts: [
      "Tổng quan tình hình kinh doanh tháng này và các vấn đề cần chú ý",
      "Phân tích doanh thu tháng này theo tuần và so sánh kỳ trước",
      "Tổng hợp doanh thu theo khách hàng tháng này, sắp xếp từ cao xuống thấp và kèm tỷ suất lợi nhuận",
      "Tổng hợp doanh thu theo nhóm hàng tháng này, sắp xếp từ cao xuống thấp",
      "Tổng hợp doanh thu theo nhân viên sale tháng này, sắp xếp từ cao xuống thấp",
      "Tổng hợp doanh thu theo vùng tháng này, sắp xếp từ cao xuống thấp",
      "So sánh doanh thu tháng này với tháng trước và cùng kỳ năm trước",
      "Top 10 khách hàng có doanh thu cao nhất tháng này",
      "Top 10 sản phẩm có doanh thu cao nhất tháng này",
      "Những khách hàng có doanh thu giảm mạnh so với tháng trước",
      "Nhân viên sale nào chưa đạt doanh thu kỳ vọng trong tháng này?",
      "Vùng nào có doanh thu tăng trưởng tốt nhất trong 3 tháng gần đây?",
      "Nhóm hàng nào đang đóng góp nhiều doanh thu nhất?",
      "Phân tích doanh thu, giá vốn, lợi nhuận và tỷ suất lợi nhuận tháng này",
      "Sản phẩm nào có chênh lệch giá bán so với giá vốn dưới 10% tháng này?",
      "Khách hàng nào có tỷ suất lợi nhuận dưới 10% tháng này?",
      "Doanh thu trả lại tháng này là bao nhiêu và tập trung ở sản phẩm nào?",
      "Ngày nào có doanh thu cao nhất và thấp nhất trong tháng này?",
      "Dự báo xu hướng doanh thu cuối tháng dựa trên số liệu hiện tại",
      "Nêu 5 cơ hội và rủi ro kinh doanh đáng chú ý nhất hiện nay",
    ],
  },
  {
    title: "Kiểm tra đơn hàng và giao hàng",
    description:
      "Xem đơn mới, đơn chưa giao, đơn giao trễ và tình hình giao hàng của từng nhân viên.",
    result: "Số lượng theo trạng thái và danh sách đơn cần xử lý trước.",
    icon: Truck,
    tone: "bg-cyan-500/10 text-cyan-700",
    featuredPromptIndexes: [0, 3],
    prompts: [
      "Có những đơn hàng nào chưa giao hoặc đang quá hạn?",
      "Phân tích tỷ lệ giao hàng đúng hạn tháng này theo sale",
      "Tổng hợp số đơn hàng theo trạng thái trong tháng này",
      "Đơn hàng nào cần ưu tiên xử lý hôm nay?",
      "Top 20 đơn hàng có giá trị lớn nhất chưa hoàn tất",
      "Những đơn hàng nào đã xác nhận nhưng chưa giao?",
      "Những đơn hàng nào giao thiếu so với số lượng đặt?",
      "Những đơn hàng nào giao trễ trên 7 ngày?",
      "Khách hàng nào có nhiều đơn giao trễ nhất tháng này?",
      "Nhân viên sale nào có nhiều đơn chưa hoàn tất nhất?",
      "Phân tích giá trị đơn hàng theo trạng thái trong tháng này",
      "So sánh số đơn và giá trị đơn hàng tháng này với tháng trước",
      "Tỷ lệ hoàn thành đơn hàng theo từng nhân viên sale",
      "Tỷ lệ giao hàng đúng hạn theo từng vùng",
      "Đơn hàng nào có ngày giao dự kiến trong 7 ngày tới?",
      "Đơn hàng nào chưa có ngày giao dự kiến?",
      "Đơn hàng nào bị hủy trong tháng này và tổng giá trị bao nhiêu?",
      "Khách hàng nào đặt nhiều đơn nhất trong tháng này?",
      "Sản phẩm nào xuất hiện nhiều nhất trong các đơn chưa giao?",
      "Tóm tắt các vấn đề đơn hàng cần xử lý trước trong hôm nay",
    ],
  },
  {
    title: "Tra cứu nhân viên phụ trách khách hàng",
    description:
      "Tìm khách hàng do ai phụ trách, mỗi nhân viên quản lý bao nhiêu khách và khách nào chưa được phân công.",
    result:
      "Tên nhân viên, danh sách khách hàng và các trường hợp phân công sai hoặc thiếu.",
    icon: User,
    tone: "bg-indigo-500/10 text-indigo-700",
    featuredPromptIndexes: [3, 7, 19],
    prompts: [
      "Mỗi sale đang phụ trách bao nhiêu khách hàng?",
      "Sale Hà Duy Phú đang phụ trách những khách hàng nào?",
      "Khách hàng nào đã hơn 90 ngày chưa mua hàng?",
      "Khách hàng nào cần chăm sóc lại?",
      "Khách hàng nào chưa được phân công nhân viên phụ trách?",
      "Top 20 khách hàng có doanh thu cao nhất tháng này",
      "Khách hàng nào có doanh thu giảm so với tháng trước?",
      "Khách hàng mới phát sinh giao dịch trong tháng này là ai?",
      "Khách hàng nào ngừng mua hàng trong 60 ngày gần đây?",
      "Khách hàng nào mua hàng thường xuyên nhất trong 6 tháng gần đây?",
      "Khách hàng nào có giá trị đơn hàng trung bình cao nhất?",
      "Khách hàng nào có tỷ suất lợi nhuận thấp hơn 10%?",
      "Phân nhóm khách hàng theo doanh thu trong năm nay",
      "Tổng hợp doanh thu và lợi nhuận của từng khách hàng tháng này",
      "Khách hàng nào vừa có doanh thu cao vừa có công nợ lớn?",
      "Khách hàng nào có nhiều lần trả hàng nhất trong năm nay?",
      "Top khách hàng tăng trưởng doanh thu tốt nhất trong 3 tháng gần đây",
      "Mỗi vùng hiện có bao nhiêu khách hàng đang hoạt động?",
      "Mỗi nhân viên sale có bao nhiêu khách hàng đã mua trong tháng này?",
      "Đề xuất danh sách khách hàng nên ưu tiên chăm sóc tuần này",
    ],
  },
  {
    title: "Theo dõi tiền khách hàng còn nợ",
    description:
      "Xem tổng tiền còn phải thu, tiền phát sinh trong kỳ và khách hàng đang nợ nhiều.",
    result: "Tổng công nợ, thay đổi theo tuần và danh sách khách cần theo dõi.",
    icon: WalletCards,
    tone: "bg-rose-500/10 text-rose-700",
    featuredPromptIndexes: [2, 18, 19],
    prompts: [
      "Phân tích công nợ tháng này theo tuần",
      "Top 10 khách hàng có dư công nợ lớn nhất đến hôm nay",
      "Top 10 khách hàng có dư công nợ lớn nhất và nhận định rủi ro, kèm tỷ suất lợi nhuận",
      "Tổng dư công nợ phải thu hiện tại là bao nhiêu?",
      "Khách hàng nào có công nợ quá hạn lớn nhất?",
      "Phân loại công nợ theo thời gian quá hạn",
      "Công nợ phát sinh và đã thu trong tháng này là bao nhiêu?",
      "So sánh dư công nợ hiện tại với cuối tháng trước",
      "Nhân viên sale nào đang quản lý nhiều công nợ nhất?",
      "Tổng hợp công nợ theo vùng từ cao xuống thấp",
      "Khách hàng nào vừa nợ lớn vừa lâu không mua hàng?",
      "Khách hàng nào có dư nợ tăng mạnh trong tháng này?",
      "Khách hàng nào đã giảm công nợ nhiều nhất trong tháng này?",
      "Liệt kê các khoản phải thu đến hạn trong 7 ngày tới",
      "Liệt kê các khoản phải thu đã quá hạn trên 30 ngày",
      "Top khách hàng có tỷ lệ công nợ trên doanh thu cao nhất",
      "Công nợ của từng khách hàng do sale Hà Duy Phú phụ trách",
      "Ước tính số tiền có thể thu trong tháng này từ các khoản đến hạn",
      "Khách hàng nào cần liên hệ thu hồi công nợ trước?",
      "Nêu các rủi ro công nợ và đề xuất việc cần làm ngay",
    ],
  },
  {
    title: "Kiểm tra hàng trong kho",
    description:
      "Xem sản phẩm còn bao nhiêu, hàng tồn âm, đã hết hạn hoặc sắp hết hạn.",
    result: "Số lượng theo sản phẩm/kho và danh sách rủi ro cần xử lý.",
    icon: Boxes,
    tone: "bg-amber-500/10 text-amber-700",
    featuredPromptIndexes: [1, 7],
    prompts: [
      "Top sản phẩm có lượng tồn kho lớn nhất hiện nay",
      "Có lô hàng nào sắp hết hạn trong 30 ngày tới không?",
      "Tổng giá trị tồn kho hiện tại là bao nhiêu?",
      "Có sản phẩm nào đang tồn kho âm không?",
      "Sản phẩm nào đã hết hàng?",
      "Sản phẩm nào đang dưới mức tồn kho an toàn?",
      "Top 20 sản phẩm tồn kho lâu nhất hiện nay",
      "Sản phẩm nào tồn kho nhiều nhưng bán chậm trong 90 ngày gần đây?",
      "Sản phẩm nào có nguy cơ thiếu hàng dựa trên tốc độ bán gần đây?",
      "Tổng hợp tồn kho theo nhóm hàng",
      "Tổng hợp tồn kho theo từng kho",
      "Lô hàng nào đã hết hạn nhưng vẫn còn tồn?",
      "Lô hàng nào sẽ hết hạn trong 60 ngày tới?",
      "Giá trị hàng sắp hết hạn trong 30 ngày tới là bao nhiêu?",
      "Sản phẩm nào có chênh lệch tồn kho bất thường?",
      "So sánh tồn kho hiện tại với cuối tháng trước",
      "Những sản phẩm nào không phát sinh bán trong 6 tháng nhưng vẫn còn tồn?",
      "Top sản phẩm có tốc độ luân chuyển kho nhanh nhất",
      "Top sản phẩm có tốc độ luân chuyển kho chậm nhất",
      "Đề xuất danh sách hàng cần nhập thêm hoặc xử lý tồn kho",
    ],
  },
  {
    title: "Theo dõi hàng đang về",
    description:
      "Xem lô hàng đang vận chuyển, ngày dự kiến về và hàng nào đã thực sự nhập kho.",
    result: "Mã lô, nhà cung cấp, ngày dự kiến về, trạng thái và số lượng.",
    icon: Truck,
    tone: "bg-sky-500/10 text-sky-700",
    featuredPromptIndexes: [0, 4],
    prompts: [
      "Trong 30 ngày tới có những lô hàng nào dự kiến về?",
      "Tuần này đã thực nhập những mặt hàng nào?",
      "Hôm nay có lô hàng nào dự kiến về không?",
      "Trong 7 ngày tới có những lô hàng nào dự kiến về?",
      "Lô hàng nào đang vận chuyển nhưng đã trễ ngày dự kiến?",
      "Tổng giá trị hàng đang vận chuyển là bao nhiêu?",
      "Tổng hợp hàng đang về theo nhà cung cấp",
      "Tổng hợp hàng đang về theo nhóm sản phẩm",
      "Nhà cung cấp nào có nhiều lô đang vận chuyển nhất?",
      "Nhà cung cấp nào thường xuyên giao trễ?",
      "Lô hàng nào chưa có ngày dự kiến về?",
      "Lô hàng nào đã về nhưng chưa nhập kho đầy đủ?",
      "So sánh số lượng dự kiến và số lượng thực nhập trong tháng này",
      "Những sản phẩm nào sẽ được bổ sung trong 14 ngày tới?",
      "Sản phẩm sắp hết hàng nào đang có lô trên đường về?",
      "Có lô hàng nào bị lỗi hoặc bị từ chối nhập không?",
      "Tháng này đã nhập kho bao nhiêu lô hàng và tổng giá trị bao nhiêu?",
      "Tổng hợp tiến độ các shipment đang mở",
      "Lô hàng nào cần làm việc ngay với nhà cung cấp?",
      "Đề xuất thứ tự ưu tiên theo dõi các lô hàng đang về",
    ],
  },
  {
    title: "Theo dõi khách hàng VIP",
    description:
      "Xem số khách theo từng hạng và khách nào sắp đủ điểm để lên hạng tiếp theo.",
    result: "Hạng hiện tại, tổng điểm, hạng tiếp theo và số điểm còn thiếu.",
    icon: Sparkles,
    tone: "bg-violet-500/10 text-violet-700",
    featuredPromptIndexes: [11, 17],
    prompts: [
      "Khách hàng nào còn thiếu ít điểm nhất để lên hạng VIP?",
      "Thống kê số lượng khách hàng theo từng hạng VIP năm nay",
      "Danh sách khách hàng VIP hiện tại theo từng hạng",
      "Khách hàng nào mới lên hạng VIP trong tháng này?",
      "Khách hàng nào bị giảm hạng VIP trong năm nay?",
      "Doanh thu theo từng hạng khách hàng VIP tháng này",
      "Lợi nhuận và tỷ suất lợi nhuận theo từng hạng VIP",
      "Top 20 khách hàng VIP có doanh thu cao nhất năm nay",
      "Khách hàng VIP nào lâu chưa mua hàng?",
      "Khách hàng VIP nào có doanh thu giảm mạnh trong 3 tháng gần đây?",
      "Khách hàng VIP nào đang có công nợ lớn?",
      "Khách hàng VIP nào có công nợ quá hạn?",
      "Mỗi nhân viên sale đang phụ trách bao nhiêu khách VIP?",
      "Khách hàng nào sắp đủ điểm lên hạng tiếp theo?",
      "Khách hàng nào còn dưới 10% số điểm để lên hạng?",
      "Tổng số điểm VIP đã phát sinh trong tháng này",
      "So sánh doanh thu khách VIP với khách thường tháng này",
      "Những khách VIP nào cần chăm sóc lại tuần này?",
      "Khách VIP nào có nhiều lần mua nhất trong năm nay?",
      "Đề xuất chương trình chăm sóc cho từng nhóm khách VIP",
    ],
  },
  {
    title: "Sản xuất và nhà cung cấp",
    description:
      "Kiểm tra lệnh sản xuất, nguyên liệu còn thiếu và nhà cung cấp giao hàng trễ hoặc có hàng lỗi.",
    result:
      "Tiến độ thực hiện và danh sách vấn đề cần làm việc với bộ phận liên quan.",
    icon: PackageCheck,
    tone: "bg-emerald-500/10 text-emerald-700",
    featuredPromptIndexes: [0, 1],
    prompts: [
      "Lệnh sản xuất nào đang thiếu nguyên liệu?",
      "Nhà cung cấp nào có shipment giao trễ hoặc hàng lỗi?",
      "Tổng hợp lệnh sản xuất theo trạng thái hiện tại",
      "Lệnh sản xuất nào đang trễ tiến độ?",
      "Lệnh sản xuất nào cần ưu tiên hoàn thành trước?",
      "Kế hoạch sản xuất trong 7 ngày tới gồm những gì?",
      "Sản lượng kế hoạch và thực tế tháng này chênh lệch bao nhiêu?",
      "Sản phẩm nào có tỷ lệ hoàn thành kế hoạch thấp nhất?",
      "Nguyên liệu nào đang thiếu cho các lệnh sản xuất mở?",
      "Nguyên liệu nào sắp hết và cần đặt thêm?",
      "Tổng nhu cầu nguyên liệu cho kế hoạch sản xuất tháng này",
      "Lệnh sản xuất nào chưa được cấp đủ nguyên liệu?",
      "Tổng hợp sản lượng theo từng xưởng hoặc bộ phận sản xuất",
      "Tỷ lệ hàng lỗi trong sản xuất tháng này là bao nhiêu?",
      "Sản phẩm nào có tỷ lệ hàng lỗi cao nhất?",
      "Nhà cung cấp nào cung cấp nguyên liệu lỗi nhiều nhất?",
      "So sánh tiến độ sản xuất tháng này với tháng trước",
      "Các lệnh sản xuất hoàn thành trong tuần này",
      "Các lệnh sản xuất dự kiến hoàn thành trong 7 ngày tới",
      "Nêu các rủi ro sản xuất và việc cần xử lý ngay",
    ],
  },
];

const guideTabs = [
  ["overview", "Bắt đầu"],
  ["revenue", "Doanh thu"],
  ["orders", "Đơn hàng"],
  ["customers", "Khách hàng"],
  ["receivables", "Công nợ"],
  ["inventory", "Tồn kho"],
  ["shipments", "Hàng về"],
  ["vip", "Khách VIP"],
  ["production", "Sản xuất"],
  ["asking", "Cách hỏi hiệu quả"],
] as const;

function AssistantGuide({ onAsk }: { onAsk: (prompt: string) => void }) {
  const [activeTab, setActiveTab] =
    useState<(typeof guideTabs)[number][0]>("overview");

  return (
    <div className="space-y-5 pb-8">
      <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-6 shadow-sm sm:p-8">
        <Badge variant="secondary" className="mb-4 gap-1.5 rounded-full">
          <BookOpen className="size-3.5" /> Hướng dẫn sử dụng
        </Badge>
        <h2 className="text-2xl font-semibold tracking-tight">
          Hỏi dữ liệu VLife bằng câu nói thông thường
        </h2>
        <p className="text-muted-foreground mt-3 max-w-3xl text-sm leading-6">
          Không cần biết tên báo cáo hay thao tác kỹ thuật. Chỉ cần nói điều
          muốn biết, ví dụ “Doanh thu tháng này thế nào?” hoặc “Khách nào đang
          nợ nhiều?”. Trợ lý sẽ tự tìm dữ liệu phù hợp và trình bày lại dễ đọc.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as (typeof guideTabs)[number][0])
        }
        className="gap-4"
      >
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-11 min-w-max justify-start rounded-xl p-1">
            {guideTabs.map(([value, label]) => (
              <TabsTrigger
                key={value}
                value={value}
                className="h-9 rounded-lg px-3 transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview">
          <GuideStart onAsk={onAsk} />
        </TabsContent>
        <TabsContent value="revenue">
          <GuideCapability capability={guideCapabilities[0]} onAsk={onAsk} />
        </TabsContent>
        <TabsContent value="orders">
          <GuideCapability capability={guideCapabilities[1]} onAsk={onAsk} />
        </TabsContent>
        <TabsContent value="customers">
          <GuideCapability capability={guideCapabilities[2]} onAsk={onAsk} />
        </TabsContent>
        <TabsContent value="receivables">
          <GuideCapability capability={guideCapabilities[3]} onAsk={onAsk} />
        </TabsContent>
        <TabsContent value="inventory">
          <GuideCapability capability={guideCapabilities[4]} onAsk={onAsk} />
        </TabsContent>
        <TabsContent value="shipments">
          <GuideCapability capability={guideCapabilities[5]} onAsk={onAsk} />
        </TabsContent>
        <TabsContent value="vip">
          <GuideCapability capability={guideCapabilities[6]} onAsk={onAsk} />
        </TabsContent>
        <TabsContent value="production">
          <GuideCapability capability={guideCapabilities[7]} onAsk={onAsk} />
        </TabsContent>
        <TabsContent value="asking">
          <EffectiveQuestionGuide onAsk={onAsk} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GuideStart({ onAsk }: { onAsk: (prompt: string) => void }) {
  const featuredCount = guideCapabilities.reduce(
    (total, capability) => total + capability.featuredPromptIndexes.length,
    0,
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["1", "Chọn nội dung", "Mở tab đúng việc bạn muốn xem."],
          ["2", "Chọn câu hỏi mẫu", "Bấm câu gần nhất với điều bạn muốn biết."],
          ["3", "Bấm Phân tích", "Kiểm tra câu hỏi trong ô chat rồi gửi."],
        ].map(([number, title, description]) => (
          <div
            key={number}
            className="flex gap-3 rounded-xl border bg-background p-4 shadow-sm"
          >
            <span className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
              {number}
            </span>
            <div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-muted-foreground mt-1 text-xs leading-5">
                {description}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-end justify-between gap-4 pt-2">
        <div>
          <h3 className="text-base font-semibold">Câu hỏi nổi bật</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Chọn nhanh những câu hỏi hữu ích nhất từ các nhóm phân tích.
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0 rounded-full">
          {featuredCount} câu hỏi
        </Badge>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        {guideCapabilities.map((capability) => (
          <Card
            key={capability.title}
            className="gap-0 overflow-hidden py-0 shadow-sm"
          >
            <CardHeader className="border-b bg-muted/20 p-4">
              <CardTitle className="flex items-center gap-2.5 text-sm">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg",
                    capability.tone,
                  )}
                >
                  <capability.icon className="size-4" />
                </span>
                {capability.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 p-4">
              {capability.featuredPromptIndexes.map((promptIndex) => {
                const prompt = capability.prompts[promptIndex];
                return prompt ? (
                  <GuidePrompt key={prompt} prompt={prompt} onAsk={onAsk} />
                ) : null;
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function GuideCapability({
  capability,
  onAsk,
}: {
  capability: (typeof guideCapabilities)[number];
  onAsk: (prompt: string) => void;
}) {
  return (
    <Card className="mx-auto max-w-3xl gap-0 overflow-hidden py-0 shadow-sm">
      <CardHeader className="border-b bg-muted/20 p-5">
        <CardTitle className="flex items-center gap-3 text-base">
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              capability.tone,
            )}
          >
            <capability.icon className="size-5" />
          </span>
          {capability.title}
        </CardTitle>
        <p className="text-muted-foreground text-sm leading-6">
          {capability.description}
        </p>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        <div className="rounded-xl bg-muted/60 p-4 text-sm leading-6">
          <span className="font-semibold">Kết quả bạn sẽ nhận được: </span>
          <span className="text-muted-foreground">{capability.result}</span>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider">
            Bấm câu hỏi để sử dụng ngay
          </p>
          <div className="grid gap-2 lg:grid-cols-2">
            {capability.prompts.map((prompt) => (
              <GuidePrompt key={prompt} prompt={prompt} onAsk={onAsk} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GuidePrompt({
  prompt,
  onAsk,
}: {
  prompt: string;
  onAsk: (prompt: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onAsk(prompt)}
      className="group flex w-full items-start justify-between gap-3 rounded-xl border bg-background p-3 text-left text-sm leading-6 transition-colors hover:border-primary/30 hover:bg-muted"
    >
      <span>{prompt}</span>
      <ArrowUpRight className="text-muted-foreground mt-1 size-4 shrink-0" />
    </button>
  );
}

function EffectiveQuestionGuide({
  onAsk,
}: {
  onAsk: (prompt: string) => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">
            Một câu hỏi tốt gồm 3 phần
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-6">
          <div>
            <p className="font-semibold">1. Muốn xem việc gì?</p>
            <p className="text-muted-foreground">
              Doanh thu, đơn hàng, công nợ, tồn kho hoặc khách hàng.
            </p>
          </div>
          <div>
            <p className="font-semibold">2. Trong thời gian nào?</p>
            <p className="text-muted-foreground">
              Hôm nay, tuần này, tháng 9/2026 hoặc từ ngày A đến ngày B.
            </p>
          </div>
          <div>
            <p className="font-semibold">3. Muốn trình bày thế nào?</p>
            <p className="text-muted-foreground">
              So sánh kỳ trước, chia theo tuần, lấy top 10 hoặc nêu việc cần xử
              lý.
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Câu hỏi đầy đủ mẫu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            "Phân tích doanh thu tháng này theo tuần, so sánh với kỳ trước và nêu điểm bất thường",
            "Top 10 khách hàng có dư công nợ lớn nhất đến hôm nay và nêu khách cần theo dõi",
            "Trong 30 ngày tới có những lô hàng nào dự kiến về? Cho biết nhà cung cấp và ngày dự kiến",
          ].map((prompt) => (
            <GuidePrompt key={prompt} prompt={prompt} onAsk={onAsk} />
          ))}
          <div className="text-muted-foreground mt-4 rounded-xl bg-muted/60 p-4 text-xs leading-5">
            <ShieldCheck className="mr-2 inline size-4 text-emerald-600" />
            Sau khi có kết quả, bạn có thể hỏi tiếp: “so với tháng trước?”, “chi
            tiết từng khách?” hoặc “việc nào cần xử lý trước?”.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function splitActionSection(content: string) {
  const heading = /(?:^|\n)#{1,6}\s+Việc nên làm tiếp\s*\n/i.exec(content);
  if (!heading || heading.index === undefined)
    return { answer: content, actions: "" };
  const tail = content.slice(heading.index + heading[0].length);
  const next = tail.search(/\n#{1,6}\s/);
  return {
    answer:
      content.slice(0, heading.index) + (next >= 0 ? tail.slice(next) : ""),
    actions: next >= 0 ? tail.slice(0, next) : tail,
  };
}

function AssistantBubble({ message }: { message: AssistantMessage }) {
  const warnings = message.result.warnings ?? [];
  const charts = message.result.charts ?? [];
  const sources = message.result.sources ?? [];
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [feedback, setFeedback] = useState<"USEFUL" | "NOT_USEFUL" | null>(null);
  const [feedbackReason, setFeedbackReason] = useState<string | null>(null);
  const feedbackMutation = useMutation({
    mutationFn: sendAiFeedback,
  });
  const { answer, actions } = splitActionSection(message.content);

  async function copyAnswer() {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopyError(false);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopyError(true);
    }
  }

  function rate(rating: "USEFUL" | "NOT_USEFUL", reasonCode?: string) {
    setFeedback(rating);
    if (reasonCode) setFeedbackReason(reasonCode);
    feedbackMutation.mutate({
      request_id: message.result.request_id,
      rating,
      reason_code: reasonCode,
    });
  }

  return (
    <div className="flex items-start gap-3 py-1">
      <span className="from-primary to-primary/75 text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm">
        <Bot className="size-4" />
      </span>
      <div className="min-w-0 w-full max-w-6xl space-y-4">
        <div className="overflow-hidden rounded-2xl rounded-tl-md border border-border/70 bg-background shadow-sm">
          <div className="flex items-center justify-between border-b bg-muted/30 px-5 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Sparkles className="text-primary size-3.5" /> Phân tích điều hành
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground h-7 gap-1.5 px-2 text-[11px]"
              onClick={copyAnswer}
            >
              {copied ? (
                <Check className="size-3.5 text-emerald-600" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copied ? "Đã sao chép" : "Sao chép"}
            </Button>
          </div>
          <div className="px-5 py-5 text-sm leading-7 sm:px-6">
            {renderAssistantText(answer)}
          </div>
        </div>

        {copyError && (
          <p role="status" className="text-xs text-muted-foreground">
            Không thể sao chép tự động. Bạn có thể chọn và sao chép nội dung
            trực tiếp.
          </p>
        )}
        {actions && (
          <section
            className="rounded-2xl border border-emerald-600/20 bg-emerald-500/[0.04] p-5 sm:p-6"
            aria-label="Việc nên làm tiếp"
          >
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <ClipboardCheck className="size-4 text-emerald-600" />
              Việc nên làm tiếp
            </h3>
            <div className="text-sm leading-7">
              {renderAssistantText(actions)}
            </div>
          </section>
        )}
        {warnings.length > 0 && (
          <Alert className="border-amber-300 bg-amber-50 text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">
            <AlertCircle />
            <AlertTitle>
              Cần lưu ý về dữ liệu{" "}
              <span className="ml-1 font-normal">({warnings.length})</span>
            </AlertTitle>
            <AlertDescription>
              {warnings.slice(0, 2).map((warning) => (
                <p key={warning} className="leading-6">
                  {warning}
                </p>
              ))}
              {warnings.length > 2 && (
                <details className="mt-2 w-full">
                  <summary className="cursor-pointer text-xs font-medium underline underline-offset-4">
                    Xem thêm {warnings.length - 2} lưu ý
                  </summary>
                  <div className="mt-3 space-y-2">
                    {warnings.slice(2).map((warning) => (
                      <p key={warning} className="leading-6">
                        {warning}
                      </p>
                    ))}
                  </div>
                </details>
              )}
            </AlertDescription>
          </Alert>
        )}

        {charts.map((chart) => (
          <ExecutiveChart key={chart.id} chart={chart} />
        ))}

        {sources.length > 0 && (
          <details className="group overflow-hidden rounded-xl border border-border/70 bg-background shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-semibold hover:bg-muted/30">
              <span className="flex items-center gap-2">
                <Database className="text-primary size-4" /> Nguồn dữ liệu{" "}
                <Badge
                  variant="secondary"
                  className="h-5 min-w-5 justify-center rounded-full px-1.5"
                >
                  {sources.length}
                </Badge>
              </span>
              <span className="text-muted-foreground font-normal">
                Xem nguồn báo cáo
              </span>
            </summary>
            <div className="grid gap-3 border-t bg-muted/10 p-3 sm:grid-cols-2">
              {sources.map((source) => (
                <Card
                  key={`${source.report_id}-${source.from_date}-${source.to_date}`}
                  className="gap-0 border-border/70 py-0 shadow-none"
                >
                  <CardContent className="space-y-2 p-4 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{source.label}</span>
                    </div>
                    <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>
                        {formatDate(source.from_date)} –{" "}
                        {formatDate(source.to_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock3 className="size-3" />{" "}
                        {formatDateTime(source.generated_at)}
                      </span>
                    </div>
                    {reportUrl(source) && (
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-8 w-full justify-between px-2 text-xs"
                      >
                        <a
                          href={reportUrl(source)!}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Mở báo cáo chi tiết{" "}
                          <ExternalLink className="size-3.5" />
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </details>
        )}

        <div className="text-muted-foreground flex items-center gap-2 px-1 text-[10px]">
          <PackageCheck className="size-3" /> Kết quả được tổng hợp từ dữ liệu
          VLife · {message.result.request_id.slice(0, 8)}
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-medium">Câu trả lời này có hữu ích không?</span>
            <Button
              type="button"
              size="sm"
              variant={feedback === "USEFUL" ? "default" : "outline"}
              className="h-8 gap-1.5 rounded-full text-xs"
              disabled={feedbackMutation.isPending}
              onClick={() => rate("USEFUL")}
            >
              <ThumbsUp className="size-3.5" /> Hữu ích
            </Button>
            <Button
              type="button"
              size="sm"
              variant={feedback === "NOT_USEFUL" ? "destructive" : "outline"}
              className="h-8 gap-1.5 rounded-full text-xs"
              disabled={feedbackMutation.isPending}
              onClick={() => rate("NOT_USEFUL")}
            >
              <ThumbsDown className="size-3.5" /> Chưa tốt
            </Button>
            {feedback === "USEFUL" && (
              <span className="text-xs text-emerald-600">Đã ghi nhận, cảm ơn bạn.</span>
            )}
          </div>
          {feedback === "NOT_USEFUL" && (
            <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
              {[
                ["MISSING_DATA", "Thiếu số liệu"],
                ["WRONG_DATA", "Sai số liệu"],
                ["NOT_RELEVANT", "Chưa đúng trọng tâm"],
                ["HARD_TO_UNDERSTAND", "Khó hiểu"],
                ["TOO_SLOW", "Phản hồi chậm"],
              ].map(([code, label]) => (
                <Button
                  key={code}
                  type="button"
                  size="sm"
                  variant={feedbackReason === code ? "secondary" : "ghost"}
                  className="h-7 rounded-full px-3 text-[11px]"
                  disabled={feedbackMutation.isPending}
                  onClick={() => rate("NOT_USEFUL", code)}
                >
                  {label}
                </Button>
              ))}
              {feedbackReason && (
                <span className="self-center text-xs text-muted-foreground">Đã ghi nhận lý do.</span>
              )}
            </div>
          )}
          {feedbackMutation.isError && (
            <p className="mt-2 text-xs text-destructive">{feedbackMutation.error instanceof Error && feedbackMutation.error.message !== "Failed to fetch" ? feedbackMutation.error.message : "Chưa lưu được đánh giá. Vui lòng thử lại."}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ExecutiveChart({
  chart,
}: {
  chart: AiChatResponse["charts"][number];
}) {
  const isReceivable = chart.id === "receivables-weekly-trend";
  const isCustomerPerformance = chart.id === "sales-customer-performance";
  const isRanking =
    chart.id.startsWith("sales-breakdown-") || isCustomerPerformance;
  const rankingChartHeight = Math.max(260, chart.points.length * 34);
  const labels: Record<string, string> = isReceivable
    ? {
        debit_amount: "Phát sinh Nợ",
        credit_amount: "Phát sinh Có",
        net_amount: "Chênh lệch",
      }
    : isRanking
      ? {
          value: "Doanh thu thuần",
          secondary_value: isCustomerPerformance
            ? "Lợi nhuận gộp tạm tính"
            : "Hàng trả lại",
        }
      : { net_revenue: "Doanh thu thuần", return_revenue: "Hàng trả lại" };

  return (
    <Card className="overflow-hidden border-border/70 py-0 shadow-sm">
      <CardHeader className="border-b bg-muted/25 px-5 py-4">
        <CardTitle className="flex items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary inline-flex size-8 items-center justify-center rounded-lg">
              <BarChart3 className="size-4" />
            </span>
            {chart.title}
          </span>
          <Badge variant="outline" className="font-normal">
            {chart.unit}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent
        className="min-w-0 px-2 pt-4 sm:px-4"
        style={{ height: isRanking ? rankingChartHeight + 28 : 288 }}
      >
        <ResponsiveContainer
          width="100%"
          height={isRanking ? rankingChartHeight : 260}
          minWidth={0}
          minHeight={260}
          debounce={50}
        >
          {isRanking ? (
            <BarChart
              data={chart.points}
              layout="vertical"
              margin={{ top: 4, right: 18, left: 16, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                opacity={0.4}
              />
              <XAxis
                type="number"
                tickFormatter={formatCompactCurrency}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={150}
                interval={0}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => truncateLabel(String(value), 22)}
              />
              <Tooltip
                formatter={(value, name) => [
                  formatCurrency(Number(value)),
                  labels[String(name)] ?? String(name),
                ]}
              />
              <Legend
                formatter={(value) => labels[String(value)] ?? String(value)}
              />
              <Bar
                dataKey="value"
                name="Doanh thu thuần"
                fill="#14b8a6"
                radius={[0, 5, 5, 0]}
              />
              <Bar
                dataKey="secondary_value"
                name={
                  isCustomerPerformance
                    ? "Lợi nhuận gộp tạm tính"
                    : "Hàng trả lại"
                }
                fill="#f59e0b"
                radius={[0, 5, 5, 0]}
              />
            </BarChart>
          ) : (
            <BarChart
              data={chart.points}
              margin={{ top: 8, right: 12, left: 8, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                opacity={0.5}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatCompactCurrency}
                width={64}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value, name) => [
                  formatCurrency(Number(value)),
                  labels[String(name)] ?? String(name),
                ]}
              />
              <Legend
                formatter={(value) => labels[String(value)] ?? String(value)}
              />
              {isReceivable ? (
                <>
                  <Bar
                    dataKey="debit_amount"
                    name="Phát sinh Nợ"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="credit_amount"
                    name="Phát sinh Có"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="net_amount"
                    name="Chênh lệch"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                  />
                </>
              ) : (
                <>
                  <Bar
                    dataKey="net_revenue"
                    name="Doanh thu thuần"
                    fill="#14b8a6"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="return_revenue"
                    name="Hàng trả lại"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                  />
                </>
              )}
            </BarChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function normalizeStoredResult(value: Partial<AiChatResponse>): AiChatResponse {
  const sources = Array.isArray(value.sources)
    ? value.sources.map((source) => ({
        ...source,
        from_date: normalizeDateValue(source.from_date),
        to_date: normalizeDateValue(source.to_date),
        generated_at: normalizeDateTimeValue(source.generated_at),
      }))
    : [];
  const charts = Array.isArray(value.charts)
    ? value.charts
        .filter((chart) => chart && Array.isArray(chart.points))
        .map((chart) => ({
          ...chart,
          points: chart.points.map((point) => ({
            ...point,
            from_date: normalizeDateValue(point.from_date),
            to_date: normalizeDateValue(point.to_date),
          })),
        }))
    : [];
  return {
    answer: value.answer ?? "",
    sources,
    warnings: Array.isArray(value.warnings) ? value.warnings : [],
    charts,
    request_id: value.request_id ?? "",
    conversation_id: value.conversation_id ?? 0,
  };
}

function normalizeDateValue(value: unknown) {
  if (Array.isArray(value) && value.length >= 3) {
    const [year, month, day] = value.map(Number);
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return typeof value === "string" ? value : "";
}

function normalizeDateTimeValue(value: unknown) {
  if (typeof value === "number") return new Date(value * 1000).toISOString();
  return typeof value === "string" ? value : "";
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase();
}

function detectPromptCategories(value: string): PromptCategory[] {
  const text = normalizeSearch(value);
  const rules: Array<[PromptCategory, string[]]> = [
    ["receivables", ["cong no", "du no", "phai thu", "khach no"]],
    ["orders", ["don hang", "don cham", "chua giao", "qua han"]],
    ["shipments", ["hang ve", "shipment", "eta", "dang di", "van chuyen"]],
    ["inventory", ["ton kho", "ton am", "het han", "can han", "thuc nhap"]],
    ["production", ["san xuat", "lenh san xuat", "nguyen lieu"]],
    ["purchasing", ["nha cung cap", "supplier", "hang loi"]],
    ["vip", ["vip", "kim cuong", "bach kim", "hang khach", "xep hang"]],
    [
      "sales",
      [
        "doanh thu",
        "hang tra lai",
        "san pham",
        "ban hang",
        "nhan vien",
        "b2b",
        "b2c",
      ],
    ],
    ["executive", ["tong quan", "dieu hanh", "giao ban", "kinh doanh"]],
  ];
  return rules
    .filter(([, keywords]) =>
      keywords.some((keyword) => text.includes(keyword)),
    )
    .map(([category]) => category);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN").format(new Date(`${value}T00:00:00`));
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  const today = new Date();
  const days = Math.floor((today.getTime() - date.getTime()) / 86_400_000);
  if (days <= 0)
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  if (days === 1) return "Hôm qua";
  if (days < 7) return `${days} ngày trước`;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(date);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

function formatCurrency(value: number) {
  return (
    new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value) +
    " đ"
  );
}

function formatCompactCurrency(value: number) {
  if (Math.abs(value) >= 1_000_000_000)
    return `${(value / 1_000_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tỷ`;
  if (Math.abs(value) >= 1_000_000)
    return `${(value / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 0 })} tr`;
  return value.toLocaleString("vi-VN");
}

function truncateLabel(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function renderAssistantText(content: string) {
  const normalizedContent = content.replace(
    /(\d+),(\d{3})(?=\s*tỷ(?:\s+đồng)?)/gi,
    "$1.$2",
  );
  const lines = normalizedContent.split("\n");
  const blocks: ReactNode[] = [];
  for (let index = 0; index < lines.length; ) {
    const line = lines[index];
    if (line.includes("|") && /^\s*\|?\s*:?-+/.test(lines[index + 1] ?? "")) {
      const headers = tableCells(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].includes("|"))
        rows.push(tableCells(lines[index++]));
      blocks.push(
        <div
          key={`table-${index}`}
          className="my-4 overflow-x-auto rounded-xl border border-border/70 bg-background shadow-sm"
        >
          <table
            className="w-full table-fixed border-collapse text-sm"
            style={{ minWidth: `${Math.max(900, headers.length * 180)}px` }}
          >
            <colgroup>
              {headers.map((header, columnIndex) => (
                <col
                  key={columnIndex}
                  style={{ width: tableColumnWidth(header, headers.length) }}
                />
              ))}
            </colgroup>
            <thead className="bg-slate-100/90 dark:bg-slate-900/70">
              <tr>
                {headers.map((cell, i) => (
                  <th
                    key={i}
                    className={cn(
                      "border-b border-border/70 px-4 py-3.5 text-xs font-semibold tracking-wide text-muted-foreground",
                      isNumericTableColumn(cell) ? "text-right" : "text-left",
                    )}
                  >
                    {renderInlineBold(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, r) => (
                <tr
                  key={r}
                  className="border-b border-border/60 transition-colors last:border-0 odd:bg-background even:bg-muted/15 hover:bg-primary/5"
                >
                  {row.map((cell, c) => (
                    <td
                      key={c}
                      className={cn(
                        "px-4 py-3.5 align-middle leading-5",
                        isNumericTableColumn(headers[c])
                          ? "break-words text-right font-medium tabular-nums whitespace-normal"
                          : "text-left whitespace-normal",
                        isNameTableColumn(headers[c]) && "font-medium",
                      )}
                    >
                      {isRankTableColumn(headers[c]) ? (
                        <span
                          className={cn(
                            "inline-flex size-7 items-center justify-center rounded-full text-xs font-semibold",
                            r === 0
                              ? "bg-amber-100 text-amber-800"
                              : r === 1
                                ? "bg-slate-200 text-slate-700"
                                : r === 2
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-muted text-muted-foreground",
                          )}
                        >
                          {cell}
                        </span>
                      ) : (
                        renderInlineBold(cell)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (!line.trim()) {
      if (index > 0 && lines[index - 1].trim())
        blocks.push(<div key={index} className="h-1" />);
      index++;
      continue;
    }
    const heading = line.match(/^\s*#{1,4}\s+(.+)$/);
    if (heading) {
      blocks.push(
        <h3
          key={index++}
          className="mt-5 mb-2 flex items-center gap-2 text-base font-semibold first:mt-0"
        >
          <span className="bg-primary size-1.5 rounded-full" />
          {renderInlineBold(heading[1])}
        </h3>,
      );
      continue;
    }
    const isBullet = /^\s*[-•]\s+/.test(line);
    const numbered = line.match(/^\s*(\d+)[.)]\s+(.+)$/);
    const value = numbered?.[2] ?? line.replace(/^\s*[-•]\s+/, "");
    blocks.push(
      <div
        key={index++}
        className={isBullet || numbered ? "flex gap-2.5 py-0.5" : undefined}
      >
        {isBullet && (
          <span className="text-primary font-bold" aria-hidden="true">
            •
          </span>
        )}
        {numbered && (
          <span className="bg-primary/10 text-primary mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold">
            {numbered[1]}
          </span>
        )}
        <span>{renderInlineBold(value)}</span>
      </div>,
    );
  }
  return blocks;
}

function tableCells(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function normalizedTableHeader(value: string) {
  return normalizeSearch(value.replace(/\*\*/g, "").trim());
}

function isRankTableColumn(header = "") {
  return /^(hang|stt|thu tu)$/.test(normalizedTableHeader(header));
}

function isNameTableColumn(header = "") {
  return /(nhan vien|khach hang|san pham|nha cung cap|ten)/.test(
    normalizedTableHeader(header),
  );
}

function isNumericTableColumn(header = "") {
  return /(doanh thu|hang tra lai|ty le|so luong|cong no|du no|phat sinh|gia tri|tong|diem|chenh lech|%)/.test(
    normalizedTableHeader(header),
  );
}

function tableColumnWidth(header: string, columnCount: number) {
  const normalized = normalizedTableHeader(header);
  if (isRankTableColumn(header)) return columnCount <= 4 ? "8%" : "7%";
  if (/^(ma|ma so|code)$/.test(normalized)) return "11%";
  if (isNameTableColumn(header)) return columnCount >= 6 ? "22%" : "28%";
  if (
    columnCount <= 4 &&
    /(doanh thu|cong no|du no|gia tri|tong)/.test(normalized)
  )
    return "38%";
  if (columnCount <= 4 && /(ty trong|ty le|%)/.test(normalized)) return "16%";
  if (isNumericTableColumn(header)) return columnCount >= 6 ? "17%" : "20%";
  return columnCount >= 6 ? "14%" : "18%";
}

function reportUrl(source: AiChatResponse["sources"][number]) {
  const query = new URLSearchParams({
    from_date: source.from_date,
    to_date: source.to_date,
  });
  if (source.report_id === "vip.tier-breakdown") {
    query.delete("from_date");
    query.delete("to_date");
    query.set("calc_year", source.from_date.slice(0, 4));
    return `/vip/customer?${query}`;
  }
  if (source.report_id === "inventory.inbound-items")
    return `/inventory/inbounds?${query}`;
  if (source.report_id === "inventory.risks") return `/inventory/lots`;
  if (source.report_id === "purchasing.shipment-schedule")
    return `/purchasing/shipments?${query}`;
  if (source.report_id === "purchasing.supplier-performance")
    return `/purchasing/shipments?${query}`;
  if (source.report_id.startsWith("customers.")) return `/customers`;
  if (source.report_id === "sales.target-performance")
    return `/salary/sales-actuals`;
  if (source.report_id === "sales.delivery-performance")
    return `/sales/deliveries?${query}`;
  if (source.report_id === "vip.progress") return `/vip/customer`;
  if (source.report_id === "inventory.summary") return `/inventory/summary`;
  if (source.report_id === "production.status")
    return `/production/orders?${query}`;
  if (source.report_id.startsWith("orders.")) return `/sales/orders?${query}`;
  if (source.report_id.startsWith("sales.")) return `/transactions?${query}`;
  if (source.report_id.startsWith("receivables."))
    return `/sales/ar-summary?${query}`;
  return null;
}

function renderInlineBold(value: string): ReactNode[] {
  return value
    .split(/(\*\*.*?\*\*)/g)
    .filter(Boolean)
    .map((part, index) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={index}>{part.slice(2, -2)}</strong>
      ) : (
        <span key={index}>{part}</span>
      ),
    );
}
