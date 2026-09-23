import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bot,
  ChevronsLeft,
  ChevronsRight,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { getMyPermissions } from "@/api/auth/permission";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import AiChatPage from "@/features/ai-chat";

export function FloatingAiChat() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(
    () =>
      typeof window !== "undefined" &&
      window.localStorage.getItem("vlife.ai-assistant-minimized") === "true",
  );
  const permissionsQuery = useQuery({
    queryKey: ["my-permissions"],
    queryFn: getMyPermissions,
  });

  const canUseAssistant = (permissionsQuery.data ?? []).some(
    (permission) =>
      permission.module === "ai.executive" && permission.action === "view",
  );

  if (!canUseAssistant) return null;

  function setAssistantMinimized(value: boolean) {
    setMinimized(value);
    window.localStorage.setItem("vlife.ai-assistant-minimized", String(value));
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {minimized ? (
        <Button
          type="button"
          size="icon"
          className="fixed right-0 bottom-24 z-40 h-11 w-10 rounded-l-xl rounded-r-none border border-r-0 border-white/20 shadow-lg"
          aria-label="Hiện nút Trợ lý điều hành"
          title="Hiện Trợ lý điều hành"
          onClick={() => setAssistantMinimized(false)}
        >
          <ChevronsLeft className="size-4" />
        </Button>
      ) : (
        <div className="fixed right-6 bottom-6 z-40 flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="size-9 rounded-full bg-background/95 shadow-md backdrop-blur"
            aria-label="Thu nhỏ nút Trợ lý điều hành"
            title="Thu nhỏ để không che nội dung"
            onClick={() => setAssistantMinimized(true)}
          >
            <ChevronsRight className="size-4" />
          </Button>
          <Button
            type="button"
            size="lg"
            className="group h-14 rounded-2xl border border-white/20 px-5 shadow-[0_16px_40px_-12px_hsl(var(--primary)/0.55)] transition-all hover:-translate-y-0.5 hover:shadow-xl"
            aria-label="Mở trợ lý điều hành"
            title="Mở Trợ lý AI"
            onClick={() => setOpen(true)}
          >
            <span className="relative">
              <MessageCircle className="size-5" />
              <span className="absolute -right-1 -top-1 size-2 rounded-full bg-emerald-400 ring-2 ring-primary" />
            </span>
            <span className="font-semibold">Trợ lý điều hành</span>
            <Sparkles className="size-4 text-amber-300 transition-transform group-hover:rotate-12" />
          </Button>
        </div>
      )}

      <SheetContent className="w-full gap-0 overflow-hidden border-l-border/70 bg-background p-0 sm:w-[90vw] sm:max-w-[1200px]">
        <SheetHeader className="relative border-b bg-background/95 px-6 py-4 pr-14 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="from-primary to-primary/70 text-primary-foreground flex size-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm">
              <Bot className="size-5" />
            </span>
            <div className="min-w-0">
              <SheetTitle className="flex items-center gap-2 text-base">
                Trợ lý điều hành VLife
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                  Dữ liệu nội bộ
                </span>
              </SheetTitle>
              <SheetDescription className="mt-0.5 flex items-center gap-1.5 text-xs">
                <ShieldCheck className="size-3.5" /> Dữ liệu nội bộ · Phân quyền
                theo tài khoản
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-hidden">
          <AiChatPage embedded />
        </div>
      </SheetContent>
    </Sheet>
  );
}
