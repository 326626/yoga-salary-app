"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { CheckCircle2, Code2, Paperclip, Send, Sparkles, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Feedback } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createSalaryRule, deactivateSalaryRules, getActiveSalaryRule, listSalaryRules, listStudios } from "@/lib/data";
import { describeSalaryRule } from "@/lib/salary/ruleDisplay";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { createClientId } from "@/lib/utils/id";
import { structuredSalaryRuleSchema } from "@/lib/validation";
import type { SalaryRule, Studio, StructuredSalaryRule } from "@/types";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  fileCount?: number;
};

const defaultInput = "把工资规则发给我，也可以上传截图、表格，再补充说明～";

export function SalaryRulesView({ initialStudioId }: { initialStudioId?: string }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [activeRule, setActiveRule] = useState<SalaryRule | undefined>();
  const [rules, setRules] = useState<SalaryRule[]>([]);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [studioId, setStudioId] = useState("");
  const [ruleName, setRuleName] = useState("新的工资规则");
  const [inputText, setInputText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [previewRule, setPreviewRule] = useState<StructuredSalaryRule | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [jsonMessage, setJsonMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const activeDescription = useMemo(() => (activeRule ? describeSalaryRule(activeRule.structured_rule) : null), [activeRule]);
  const previewDescription = useMemo(() => (previewRule ? describeSalaryRule(previewRule) : null), [previewRule]);
  const canConfirm = Boolean(previewRule && structuredSalaryRuleSchema.safeParse(previewRule).success);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
        return;
      }
      const [realActiveRule, realRules, realStudios] = await Promise.all([getActiveSalaryRule(supabase, currentUser.id), listSalaryRules(supabase, currentUser.id), listStudios(supabase, currentUser.id)]);
      setActiveRule(realActiveRule ?? undefined);
      setRules(realRules);
      setStudios(realStudios);
      if (realStudios.some((studio) => studio.id === initialStudioId)) setStudioId(initialStudioId ?? "");
      setLoading(false);
    }).catch(() => {
      setFeedback("网络好像开小差了，请再试一次～");
      setLoading(false);
    });
  }, [initialStudioId]);

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const nextFiles = [...files, ...Array.from(fileList)].slice(0, 5);
    setFiles(nextFiles);
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function handleSend() {
    if (!inputText.trim() && files.length === 0) {
      setFeedback("请先输入工资规则或上传文件～");
      return;
    }
    setIsParsing(true);
    setFeedback("正在帮你整理规则～");
    const currentText = inputText;
    const currentFiles = files;
    setMessages((current) => [...current, { id: createClientId("msg"), role: "user", text: currentText || "上传了附件", fileCount: currentFiles.length }]);

    try {
      const formData = new FormData();
      formData.append(previewRule ? "supplemental_message" : "raw_text", currentText);
      if (previewRule) formData.append("previous_structured_rule", JSON.stringify(previewRule));
      for (const file of currentFiles) formData.append("files", file);
      const response = await fetch("/api/ai-rule-session/parse", { method: "POST", body: formData });
      const payload = await response.json();
      if (!payload.ok) {
        setFeedback(payload.message ?? "规则有点复杂，可以手动调整一下～");
        setMessages((current) => [...current, { id: createClientId("msg"), role: "assistant", text: payload.message ?? "规则有点复杂，可以手动调整一下～" }]);
        return;
      }
      const validation = structuredSalaryRuleSchema.safeParse(payload.structured_rule);
      if (!validation.success) {
        setFeedback("AI 输出格式还不完整，请手动调整 JSON 后再校验～");
        return;
      }
      setPreviewRule(validation.data);
      setJsonText(JSON.stringify(validation.data, null, 2));
      setJsonMessage(validation.data.uncertain_items.length ? "有一些内容还不确定，可以继续补充说明。" : "规则校验通过，请确认后再启用。");
      setMessages((current) => [...current, { id: createClientId("msg"), role: "assistant", text: payload.assistant_message ?? "我整理出了一版规则草稿～" }]);
      setInputText("");
      setFiles([]);
      setFeedback(payload.message ?? "");
    } catch {
      setFeedback("规则有点复杂，可以手动调整一下～");
      setMessages((current) => [...current, { id: createClientId("msg"), role: "assistant", text: "规则有点复杂，可以手动调整一下～" }]);
    } finally {
      setIsParsing(false);
    }
  }

  function handleValidateJson() {
    try {
      const parsedJson = JSON.parse(jsonText);
      const validation = structuredSalaryRuleSchema.safeParse(parsedJson);
      if (!validation.success) {
        setPreviewRule(null);
        setJsonMessage("规则格式还不完整，请检查课时费、提成比例和不确定项。");
        return;
      }
      setPreviewRule(validation.data);
      setJsonMessage("规则校验通过，可以确认启用。");
    } catch {
      setPreviewRule(null);
      setJsonMessage("JSON 格式不太对，请检查逗号、引号和括号。");
    }
  }

  async function handleConfirm() {
    if (!previewRule) return;
    if (!user || !isSupabaseConfigured()) {
      setFeedback("登录后可以保存工资规则～");
      return;
    }
    const validation = structuredSalaryRuleSchema.safeParse(previewRule);
    if (!validation.success) {
      setJsonMessage("规则还没有校验通过，暂时不能启用。");
      return;
    }
    try {
      const supabase = createBrowserSupabaseClient();
      await deactivateSalaryRules(supabase, user.id, studioId || null);
      const newRule = await createSalaryRule(supabase, user.id, {
        teacher_id: null,
        studio_id: studioId || null,
        name: ruleName.trim() || "未命名工资规则",
        raw_text: messages.filter((item) => item.role === "user").map((item) => item.text).join("\n\n"),
        structured_rule: validation.data,
        source_type: "manual",
        active: true
      });
      setActiveRule(newRule);
      setRules((current) => [newRule, ...current.map((item) => item.studio_id === newRule.studio_id ? { ...item, active: false } : item)]);
      setFeedback("工资规则已启用～");
      setIsFormOpen(false);
      setMessages([]);
      setPreviewRule(null);
      setJsonText("");
      setInputText("");
      setFiles([]);
    } catch {
      setFeedback("保存失败，请稍后再试～");
    }
  }

  function handleCancel() {
    setIsFormOpen(false);
    setPreviewRule(null);
    setJsonText("");
    setJsonMessage("");
    setFeedback("");
    setMessages([]);
    setInputText("");
    setFiles([]);
  }

  return (
    <div className="space-y-5">
      {loading ? <div className="rounded-3xl bg-card/80 p-5 text-sm text-muted-foreground">正在加载你的记录～</div> : null}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">先确认，再启用</p>
        <h1 className="text-2xl font-semibold tracking-normal">工资规则</h1>
      </div>
      <Feedback message={feedback} tone={feedback.includes("失败") || feedback.includes("复杂") ? "error" : feedback.includes("正在") ? "warning" : "success"} />

      <Card>
        <CardHeader className="p-4"><CardTitle className="flex items-center gap-2 text-lg"><CheckCircle2 className="size-5 text-primary" />当前启用规则</CardTitle></CardHeader>
        <CardContent className="space-y-4 p-4 pt-0">
          {activeRule && activeDescription ? <><div className="flex items-start justify-between gap-3"><div><h2 className="font-medium">{activeRule.name}</h2><p className="mt-1 text-sm text-muted-foreground">这套规则会用于工资计算。</p></div><Badge>active</Badge></div><RuleDescription description={activeDescription} /></> : <div className="rounded-3xl border border-dashed bg-card/70 p-5 text-center text-sm text-muted-foreground">还没有工资规则，先设置一下工资怎么算～</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4"><CardTitle className="text-lg">已有规则</CardTitle></CardHeader>
        <CardContent className="space-y-3 p-4 pt-0">
          {rules.length === 0 ? <div className="rounded-3xl border border-dashed bg-card/70 p-5 text-center text-sm text-muted-foreground">还没有保存过工资规则～</div> : rules.slice(0, 6).map((rule) => <div key={rule.id} className="rounded-3xl bg-secondary/70 p-4"><div className="flex items-center justify-between gap-3"><div><div className="font-medium">{rule.name}</div><div className="mt-1 text-xs text-muted-foreground">{rule.studio_id ? studios.find((studio) => studio.id === rule.studio_id)?.name ?? "指定瑜伽馆" : "通用规则"}</div></div>{rule.active ? <Badge>active</Badge> : null}</div></div>)}
          {!isFormOpen ? <Button className="w-full" onClick={() => setIsFormOpen(true)}>新增工资规则</Button> : null}
        </CardContent>
      </Card>

      {isFormOpen ? (
        <Card>
          <CardHeader className="p-4"><CardTitle className="flex items-center gap-2 text-lg"><Sparkles className="size-5 text-primary" />AI 工资规则整理</CardTitle></CardHeader>
          <CardContent className="space-y-4 p-4 pt-0">
            <Field label="规则名称"><Input value={ruleName} onChange={(event) => setRuleName(event.target.value)} /></Field>
            <Field label="规则适用范围"><Select value={studioId} onChange={(event) => setStudioId(event.target.value)}><option value="">通用规则</option>{studios.map((studio) => <option key={studio.id} value={studio.id}>{studio.name}</option>)}</Select></Field>
            <div className="space-y-3 rounded-3xl border border-white/70 bg-muted/70 p-3">
              {messages.length > 0 ? <div className="space-y-2">{messages.map((message) => <div key={message.id} className={message.role === "user" ? "ml-8 rounded-2xl bg-card p-3 text-sm" : "mr-8 rounded-2xl bg-secondary/80 p-3 text-sm"}><div>{message.text}</div>{message.fileCount ? <div className="mt-1 text-xs text-muted-foreground">{message.fileCount} 个附件</div> : null}</div>)}</div> : null}
              {files.length > 0 ? <div className="flex flex-wrap gap-2">{files.map((file, index) => <span key={`${file.name}-${index}`} className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-xs text-muted-foreground">{file.name} · {(file.size / 1024 / 1024).toFixed(2)}MB<button type="button" onClick={() => removeFile(index)}><X className="size-3" /></button></span>)}</div> : null}
              <Textarea className="min-h-28 bg-card" placeholder={defaultInput} value={inputText} onChange={(event) => setInputText(event.target.value)} />
              <input ref={fileInputRef} className="hidden" type="file" multiple accept="text/plain,text/csv,image/jpeg,image/png,image/webp" onChange={(event) => addFiles(event.target.files)} />
              <div className="grid grid-cols-[auto,1fr] gap-2">
                <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}><Paperclip className="mr-2 size-4" />附件</Button>
                <Button type="button" onClick={handleSend} disabled={isParsing}><Send className="mr-2 size-4" />{isParsing ? "正在整理～" : "整理规则"}</Button>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">支持 JPG、PNG、WEBP、TXT、CSV；最多 5 个文件，每个 5MB 内。图片 OCR 正在接入中。</p>
            </div>
            <Button type="button" variant="secondary" className="w-full" onClick={handleCancel}>取消</Button>
          </CardContent>
        </Card>
      ) : null}

      {isFormOpen && previewRule && previewDescription ? (
        <Card>
          <CardHeader className="p-4"><CardTitle className="text-lg">规则草稿</CardTitle></CardHeader>
          <CardContent className="space-y-4 p-4 pt-0">
            <RuleDescription description={previewDescription} />
            {previewRule.uncertain_items.length > 0 ? <div className="space-y-2 rounded-3xl bg-amber-50 p-4 text-sm text-amber-800"><div className="font-medium">不确定项</div>{previewRule.uncertain_items.map((item) => <div key={item}>{item}</div>)}</div> : null}
            <details className="rounded-3xl bg-muted/70 p-3"><summary className="flex cursor-pointer items-center gap-2 text-sm font-medium"><Code2 className="size-4 text-primary" />查看 / 编辑 JSON</summary><div className="mt-3 space-y-3"><Textarea className="min-h-72 font-mono text-sm" value={jsonText} onChange={(event) => setJsonText(event.target.value)} /><Button type="button" variant="secondary" className="w-full" onClick={handleValidateJson}>校验规则</Button></div></details>
            {jsonMessage ? <Feedback message={jsonMessage} tone={jsonMessage.includes("通过") ? "success" : "warning"} /> : null}
            <Button className="w-full" onClick={handleConfirm} disabled={!canConfirm}>确认并启用这套规则</Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function RuleDescription({ description }: { description: ReturnType<typeof describeSalaryRule> }) {
  return (
    <div className="space-y-4">
      <RuleGroup title="课时费规则" items={description.classFeeRules} empty="暂未识别到课时费规则。" />
      <RuleGroup title="业绩提成" items={description.commissionRules} empty="暂未识别到业绩提成规则。" />
    </div>
  );
}

function RuleGroup({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return <div className="space-y-2"><h3 className="text-sm font-medium">{title}</h3>{items.length > 0 ? items.map((item) => <div key={item} className="rounded-2xl bg-secondary/70 px-3 py-2 text-sm">{item}</div>) : <div className="rounded-2xl bg-muted/70 px-3 py-2 text-sm text-muted-foreground">{empty}</div>}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
