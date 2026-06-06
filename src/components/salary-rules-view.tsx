"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { CheckCircle2, Code2, ImageUp, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Feedback } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createSalaryRule, deactivateSalaryRules, getActiveSalaryRule, listStudios } from "@/lib/data";
import { activeMockSalaryRule, mockStudios } from "@/lib/mock-data";
import { describeSalaryRule } from "@/lib/salary/ruleDisplay";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { structuredSalaryRuleSchema } from "@/lib/validation";
import type { SalaryRule, Studio, StructuredSalaryRule } from "@/types";

const exampleRuleText =
  "团课每节 100 元，代课每节 80 元，体验课不计课时费。私教课时费按会员课包单节成交价的 40%。业绩 0-10000 提成 3%，10000-30000 提成 5%，30000 以上提成 8%。";

export function SalaryRulesView({ initialStudioId }: { initialStudioId?: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeRule, setActiveRule] = useState<SalaryRule | undefined>(activeMockSalaryRule);
  const [studios, setStudios] = useState<Studio[]>(mockStudios);
  const [studioId, setStudioId] = useState("");
  const [ruleName, setRuleName] = useState("新的工资规则");
  const [rawText, setRawText] = useState(exampleRuleText);
  const [previewRule, setPreviewRule] = useState<StructuredSalaryRule | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [jsonMessage, setJsonMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [parseMessage, setParseMessage] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageMessage, setImageMessage] = useState("");
  const [isImageParsing, setIsImageParsing] = useState(false);

  const activeDescription = useMemo(() => (activeRule ? describeSalaryRule(activeRule.structured_rule) : null), [activeRule]);
  const previewDescription = useMemo(() => (previewRule ? describeSalaryRule(previewRule) : null), [previewRule]);
  const canConfirm = Boolean(previewRule && structuredSalaryRuleSchema.safeParse(previewRule).success);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      if (!currentUser) return;
      const [realActiveRule, realStudios] = await Promise.all([getActiveSalaryRule(supabase, currentUser.id), listStudios(supabase, currentUser.id)]);
      setActiveRule(realActiveRule ?? undefined);
      setStudios(realStudios);
      if (realStudios.some((studio) => studio.id === initialStudioId)) {
        setStudioId(initialStudioId ?? "");
      }
    }).catch(() => {
      setFeedback("网络好像开小差了，请再试一次～");
    });
  }, [initialStudioId]);

  useEffect(() => {
    if (user) return;
    if (studios.some((studio) => studio.id === initialStudioId)) {
      setStudioId(initialStudioId ?? "");
    }
  }, [initialStudioId, studios, user]);

  async function handleParse() {
    setIsParsing(true);
    setParseMessage("正在帮你识别规则～");
    setFeedback("");
    try {
      const response = await fetch("/api/parse-salary-rule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ raw_text: rawText })
      });
      const payload = await response.json();
      if (!payload.ok) {
        setParseMessage(payload.message ?? "识别失败，请稍后再试，或手动调整规则～");
        return;
      }
      const validation = structuredSalaryRuleSchema.safeParse(payload.structured_rule);
      if (!validation.success) {
        setPreviewRule(null);
        setJsonMessage("规则有点复杂，我没完全识别出来，你可以手动调整一下～");
        setParseMessage("");
        return;
      }
      setPreviewRule(validation.data);
      setJsonText(JSON.stringify(validation.data, null, 2));
      setJsonMessage(validation.data.uncertain_items.length > 0 ? "有一些内容还不确定，可以手动补充 JSON 后再校验。" : "已识别出规则，请先确认内容。");
      setParseMessage(payload.message ?? "");
    } catch {
      setParseMessage("识别失败，请稍后再试，或手动调整规则～");
    } finally {
      setIsParsing(false);
    }
  }

  async function handleImageParse() {
    if (!imageFile) {
      setImageMessage("请先选择一张图片～");
      return;
    }

    setIsImageParsing(true);
    setImageMessage("正在检查图片～");
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      const response = await fetch("/api/parse-salary-rule-image", {
        method: "POST",
        body: formData
      });
      const payload = await response.json();
      setImageMessage(payload.message ?? "图片识别能力已预留，当前可以先把图片里的文字复制到上方文本框识别～");
    } catch {
      setImageMessage("这张图片暂时识别不了，可以先复制文字试试～");
    } finally {
      setIsImageParsing(false);
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
    if (!previewRule) {
      return;
    }
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
        raw_text: rawText,
        structured_rule: validation.data,
        source_type: "manual",
        active: true
      });
      setActiveRule(newRule);
      setFeedback("工资规则已启用～");
    } catch {
      setFeedback("保存失败，请稍后再试～");
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">先确认，再启用</p>
        <h1 className="text-2xl font-semibold tracking-normal">工资规则</h1>
      </div>

      <Card>
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="size-5 text-primary" aria-hidden="true" />
            当前启用规则
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0">
          {activeRule && activeDescription ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-medium">{activeRule.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">这套规则会用于工资计算。</p>
                </div>
                <Badge>active</Badge>
              </div>
              <RuleDescription description={activeDescription} />
            </>
          ) : (
            <div className="rounded-3xl border border-dashed bg-card/70 p-5 text-center text-sm text-muted-foreground">还没有工资规则，先设置一下工资怎么算～</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="size-5 text-primary" aria-hidden="true" />
            输入新规则
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0">
          <Feedback message={feedback} />
          {!user ? (
            <div className="rounded-3xl bg-secondary/70 p-4 text-sm text-muted-foreground">
              你可以先试用规则识别；登录后可以保存工资规则～
              <Link href="/login" className="ml-1 font-medium text-primary">去登录</Link>
            </div>
          ) : null}
          <Field label="规则名称">
            <Input value={ruleName} onChange={(event) => setRuleName(event.target.value)} placeholder="例如：张老师 2026 工资规则" />
          </Field>
          <Field label="规则适用范围">
            <Select value={studioId} onChange={(event) => setStudioId(event.target.value)}>
              <option value="">通用规则</option>
              {studios.map((studio) => <option key={studio.id} value={studio.id}>{studio.name}</option>)}
            </Select>
          </Field>
          <p className="text-xs leading-5 text-muted-foreground">不同瑜伽馆可能有不同工资规则，可以按地点保存～</p>
          <Field label="规则文本">
            <Textarea className="min-h-40" value={rawText} onChange={(event) => setRawText(event.target.value)} />
          </Field>
          <Button className="w-full" onClick={handleParse} disabled={isParsing}>
            {isParsing ? "正在帮你识别规则～" : "帮我识别规则"}
          </Button>
          {parseMessage ? <Feedback message={parseMessage} tone={parseMessage.includes("正在") || parseMessage.includes("示例") ? "warning" : "success"} /> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ImageUp className="size-5 text-primary" aria-hidden="true" />
            上传图片识别
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0">
          <div className="rounded-3xl bg-secondary/70 p-4 text-sm leading-6 text-muted-foreground">
            支持 JPG、PNG、WEBP，最大 5MB。图片识别入口已预留，当前如果暂不支持，会提示你先复制图片中的文字识别。
          </div>
          <Field label="工资规则图片">
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setImageFile(file);
                setImageMessage(file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)}MB` : "");
              }}
            />
          </Field>
          {imageFile ? <div className="rounded-2xl bg-card/80 px-3 py-2 text-sm text-muted-foreground">{imageFile.name} · {(imageFile.size / 1024 / 1024).toFixed(2)}MB</div> : null}
          <Button type="button" variant="secondary" className="w-full" onClick={handleImageParse} disabled={isImageParsing}>
            {isImageParsing ? "正在检查图片～" : "识别图片规则"}
          </Button>
          {imageMessage ? <Feedback message={imageMessage} tone={imageMessage.includes("支持") || imageMessage.includes("复制") || imageMessage.includes("选择") ? "warning" : "success"} /> : null}
        </CardContent>
      </Card>

      {previewRule && previewDescription ? (
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-lg">AI 识别结果预览</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0">
            <RuleDescription description={previewDescription} />

            {previewRule.uncertain_items.length > 0 ? (
              <div className="space-y-2 rounded-3xl bg-amber-50 p-4 text-sm text-amber-800">
                <div className="font-medium">不确定项</div>
                {previewRule.uncertain_items.map((item) => (
                  <div key={item}>{item}</div>
                ))}
              </div>
            ) : null}

            <details className="rounded-3xl bg-muted/70 p-3">
              <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                <Code2 className="size-4 text-primary" aria-hidden="true" />
                查看 / 编辑 JSON
              </summary>
              <div className="mt-3 space-y-3">
                <Textarea className="min-h-72 font-mono text-sm" value={jsonText} onChange={(event) => setJsonText(event.target.value)} />
                <Button type="button" variant="secondary" className="w-full" onClick={handleValidateJson}>
                  校验规则
                </Button>
              </div>
            </details>

            {jsonMessage ? <Feedback message={jsonMessage} tone={jsonMessage.includes("通过") || jsonMessage.includes("识别") ? "success" : "warning"} /> : null}

            <Button className="w-full" onClick={handleConfirm} disabled={!canConfirm}>
              确认并启用这套规则
            </Button>
          </CardContent>
        </Card>
      ) : jsonText ? (
        <Card>
          <CardContent className="space-y-3 p-4">
            <Textarea className="min-h-72 font-mono text-sm" value={jsonText} onChange={(event) => setJsonText(event.target.value)} />
            <Button type="button" variant="secondary" className="w-full" onClick={handleValidateJson}>
              校验规则
            </Button>
            {jsonMessage ? <Feedback message={jsonMessage} tone="warning" /> : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function RuleDescription({
  description
}: {
  description: ReturnType<typeof describeSalaryRule>;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">课时费规则</h3>
        <div className="space-y-2">
          {description.classFeeRules.length > 0 ? (
            description.classFeeRules.map((item) => (
              <div key={item} className="rounded-2xl bg-secondary/70 px-3 py-2 text-sm">
                {item}
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-muted/70 px-3 py-2 text-sm text-muted-foreground">暂未识别到课时费规则。</div>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-medium">业绩提成</h3>
        <div className="space-y-2">
          {description.commissionRules.length > 0 ? (
            description.commissionRules.map((item) => (
              <div key={item} className="rounded-2xl bg-accent/70 px-3 py-2 text-sm">
                {item}
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-muted/70 px-3 py-2 text-sm text-muted-foreground">暂未识别到业绩提成规则。</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
