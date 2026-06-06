import { cn } from "@/lib/utils";

type FeedbackProps = {
  message?: string;
  tone?: "success" | "warning" | "error";
};

export function Feedback({ message, tone = "success" }: FeedbackProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm",
        tone === "success" && "border-primary/20 bg-accent text-primary",
        tone === "warning" && "border-amber-200 bg-amber-50 text-amber-800",
        tone === "error" && "border-destructive/20 bg-destructive/10 text-destructive"
      )}
      role={tone === "error" ? "alert" : "status"}
    >
      {message}
    </div>
  );
}
