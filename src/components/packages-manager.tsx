"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { ChevronDown, ChevronUp, PenLine, ShoppingBag, Trash2 } from "lucide-react";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Feedback } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { calculateBundlePackagePricing, calculatePackageUsageFromClasses, calculateTotalAmount, calculateUnitPrice, countPackageRelations, createMemberPackage, deleteMemberPackage, listClasses, listMembers, listPackageItems, listPackages, listStudios, updateMemberPackage, type PackageUsage } from "@/lib/data";
import { getPackageUsageLabel, getPackageUsageTone } from "@/lib/packages/usageDisplay";
import { filterPackagesByStudioAndMember, getPackageFilterEmptyMessage, type PackageStudioFilter } from "@/lib/packages/packageFilters";
import { getPackageDeletePrompt } from "@/lib/relationPrompts";
import { buildPackageSummary } from "@/lib/records/recordSummaries";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { createMemberPackageInputSchema } from "@/lib/validation";
import type { ClassRecord, CourseType, Member, MemberPackage, PackageItem, Studio } from "@/types";

type PackageForm = Omit<z.input<typeof createMemberPackageInputSchema>, "total_amount" | "total_sessions"> & {
  total_amount: string;
  unit_price: string;
  total_sessions: string;
};
type FieldErrors = Partial<Record<keyof PackageForm, string>>;

const courseTypeLabels: Record<CourseType, string> = {
  group: "团课",
  private: "私教",
  trial: "体验课",
  substitute: "代课",
  other: "其他"
};
const todayString = () => new Date().toISOString().slice(0, 10);
const initialForm = (): PackageForm => ({
  package_mode: "single",
  member_id: "",
  teacher_id: "",
  studio_id: "",
  pricing_mode: "total_amount",
  package_name: "",
  course_type: "private",
  total_amount: "",
  unit_price: "",
  total_sessions: "",
  purchase_date: todayString(),
  note: "",
  items: []
});

const emptyPackageItem = () => ({ item_name: "", course_type: "private" as CourseType, sessions: "", unit_price: "", note: "" });

export function PackagesManager({ initialMemberId, initialEditId, initialStudioId }: { initialMemberId?: string; initialEditId?: string; initialStudioId?: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [packages, setPackages] = useState<MemberPackage[]>([]);
  const [packageItems, setPackageItems] = useState<PackageItem[]>([]);
  const [bundleItems, setBundleItems] = useState<Array<ReturnType<typeof emptyPackageItem>>>([emptyPackageItem()]);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [form, setForm] = useState<PackageForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(Boolean(initialMemberId || initialEditId));
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [studioFilter, setStudioFilter] = useState<PackageStudioFilter>("all");
  const [memberFilter, setMemberFilter] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState("");
  const [tone, setTone] = useState<"success" | "warning" | "error">("success");
  const [loading, setLoading] = useState(true);

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
      const [realMembers, realStudios, realPackages, realPackageItems, realClasses] = await Promise.all([
        listMembers(supabase, currentUser.id),
        listStudios(supabase, currentUser.id),
        listPackages(supabase, currentUser.id),
        listPackageItems(supabase, currentUser.id),
        listClasses(supabase, currentUser.id)
      ]);
      setMembers(realMembers);
      setStudios(realStudios);
      setPackages(realPackages);
      setPackageItems(realPackageItems);
      setClasses(realClasses);
      const preferredMemberId = realMembers.some((member) => member.id === initialMemberId) ? initialMemberId : realMembers[0]?.id;
      const preferredStudioId = realStudios.some((studio) => studio.id === initialStudioId) ? initialStudioId : realStudios[0]?.id;
      const memberStudioId = realMembers.find((member) => member.id === preferredMemberId)?.studio_id;
      setForm((current) => ({ ...current, member_id: preferredMemberId ?? "", studio_id: memberStudioId ?? preferredStudioId ?? "" }));
      setStudioFilter(realStudios.some((studio) => studio.id === initialStudioId) ? initialStudioId ?? "all" : "all");
      setMemberFilter(realMembers.some((member) => member.id === initialMemberId) ? initialMemberId ?? "" : "");
      setLoading(false);
    }).catch(() => {
      setTone("error");
      setFeedback("网络好像开小差了，请再试一次～");
      setLoading(false);
    });
  }, [initialMemberId, initialStudioId]);

  useEffect(() => {
    if (user) return;
    if (initialMemberId && members.some((member) => member.id === initialMemberId)) {
      setForm((current) => ({ ...current, member_id: initialMemberId }));
    }
    if (initialStudioId && studios.some((studio) => studio.id === initialStudioId)) {
      setForm((current) => ({ ...current, studio_id: initialStudioId }));
    }
  }, [initialMemberId, initialStudioId, members, studios, user]);

  useEffect(() => {
    if (!initialEditId || editingId === initialEditId) return;
    const item = packages.find((record) => record.id === initialEditId);
    if (item) startEdit(item);
  }, [editingId, initialEditId, packages]);

  const unitPricePreview = useMemo(() => {
    const mode = form.pricing_mode ?? "total_amount";
    const totalAmount = Number(form.total_amount);
    const unitPrice = Number(form.unit_price);
    const totalSessions = Number(form.total_sessions);
    if (!Number.isFinite(totalSessions) || totalSessions <= 0) return 0;
    if (mode === "unit_price") return Number.isFinite(unitPrice) ? unitPrice : 0;
    if (!Number.isFinite(totalAmount)) return 0;
    return calculateUnitPrice(totalAmount, totalSessions);
  }, [form.pricing_mode, form.total_amount, form.total_sessions, form.unit_price]);
  const totalAmountPreview = useMemo(() => {
    const totalSessions = Number(form.total_sessions);
    if ((form.pricing_mode ?? "total_amount") === "unit_price") {
      const unitPrice = Number(form.unit_price);
      if (!Number.isFinite(unitPrice) || !Number.isFinite(totalSessions) || totalSessions <= 0) return 0;
      return calculateTotalAmount(unitPrice, totalSessions);
    }
    const totalAmount = Number(form.total_amount);
    return Number.isFinite(totalAmount) ? totalAmount : 0;
  }, [form.pricing_mode, form.total_amount, form.total_sessions, form.unit_price]);
  const usages = useMemo(
    () => Object.fromEntries(packages.map((item) => [item.id, calculatePackageUsageFromClasses(item, classes, packageItems)])),
    [classes, packageItems, packages]
  );
  const visiblePackages = useMemo(
    () => filterPackagesByStudioAndMember(packages, studioFilter, memberFilter),
    [memberFilter, packages, studioFilter]
  );

  function updateField(name: keyof PackageForm, value: string) {
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === "member_id") {
        const member = members.find((item) => item.id === value);
        if (member?.studio_id) next.studio_id = member.studio_id;
      }
      return next;
    });
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function startEdit(item: MemberPackage) {
    setEditingId(item.id);
    setIsFormOpen(true);
    setForm({
      member_id: item.member_id,
      package_mode: "single",
      teacher_id: item.teacher_id ?? "",
      studio_id: item.studio_id ?? "",
      pricing_mode: "total_amount",
      package_name: item.package_name,
      course_type: item.course_type,
      total_amount: String(item.total_amount),
      unit_price: String(item.unit_price),
      total_sessions: String(item.total_sessions),
      purchase_date: item.purchase_date,
      note: item.note ?? "",
      items: []
    });
    setBundleItems([emptyPackageItem()]);
    setFeedback("");
  }

  function resetForm() {
    setEditingId(null);
    setForm({ ...initialForm(), member_id: members[0]?.id ?? "", studio_id: members[0]?.studio_id ?? studios[0]?.id ?? "" });
    setBundleItems([emptyPackageItem()]);
    setErrors({});
    setIsFormOpen(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const bundlePricing = calculateBundlePackagePricing(bundleItems.map((item) => ({
      item_name: item.item_name,
      course_type: item.course_type,
      sessions: Number(item.sessions || 0),
      unit_price: Number(item.unit_price || 0),
      note: item.note
    })));
    const submission = {
      ...form,
      total_amount: form.package_mode === "bundle" ? String(bundlePricing.total_amount) : form.total_amount,
      total_sessions: form.package_mode === "bundle" ? String(bundlePricing.total_sessions) : form.total_sessions,
      unit_price: form.package_mode === "bundle" ? String(bundlePricing.unit_price) : form.unit_price,
      items: form.package_mode === "bundle" ? bundleItems.map((item) => ({ ...item, sessions: item.sessions, unit_price: item.unit_price })) : undefined
    };
    const result = createMemberPackageInputSchema.safeParse(submission);
    if (!result.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of result.error.issues) nextErrors[issue.path[0] as keyof FieldErrors] = friendlyError(issue.path[0] as keyof FieldErrors, issue.message);
      setErrors(nextErrors);
      return;
    }
    if (!user || !isSupabaseConfigured()) {
      setTone("warning");
      setFeedback("登录后可以保存课包～");
      return;
    }

    try {
      const supabase = createBrowserSupabaseClient();
      if (editingId) {
        const updated = await updateMemberPackage(supabase, user.id, editingId, result.data);
        setPackages((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setFeedback("课包已更新～");
      } else {
        const created = await createMemberPackage(supabase, user.id, result.data);
        setPackages((current) => [created, ...current]);
        setPackageItems(await listPackageItems(supabase, user.id));
        setFeedback("课包已添加～");
      }
      setTone("success");
      resetForm();
    } catch {
      setTone("error");
      setFeedback("保存失败，请稍后再试～");
    }
  }

  function updateBundleItem(index: number, field: keyof ReturnType<typeof emptyPackageItem>, value: string) {
    setBundleItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  }

  function addBundleItem() {
    setBundleItems((current) => [...current, emptyPackageItem()]);
  }

  function removeBundleItem(index: number) {
    setBundleItems((current) => current.length > 1 ? current.filter((_, itemIndex) => itemIndex !== index) : current);
  }

  async function removePackage(item: MemberPackage) {
    if (!user || !isSupabaseConfigured()) {
      setTone("warning");
      setFeedback("登录后可以删除课包～");
      return;
    }
    try {
      const supabase = createBrowserSupabaseClient();
      const counts = await countPackageRelations(supabase, user.id, item.id);
      if (!window.confirm(getPackageDeletePrompt(counts))) return;
      await deleteMemberPackage(supabase, user.id, item.id);
      setPackages((current) => current.filter((record) => record.id !== item.id));
      if (editingId === item.id) resetForm();
      setTone("success");
      setFeedback("课包已删除～");
    } catch {
      setTone("error");
      setFeedback("暂时不能删除，因为还有关联记录。可以先保留这个课包～");
    }
  }

  return (
    <div className="space-y-5">
      {loading ? <div className="rounded-3xl bg-card/80 p-5 text-sm text-muted-foreground">正在加载你的记录～</div> : null}
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">课包 / 订单</p>
        <h1 className="text-2xl font-semibold tracking-normal">管理会员课包</h1>
        <p className="text-sm leading-6 text-muted-foreground">记录成交价和课时数，私教课工资就能按单节成交价自动计算。</p>
      </header>

      <Feedback message={feedback} tone={tone} />

      {!user ? (
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-sm text-muted-foreground">登录后可以保存和同步课包～</p>
            <Button asChild className="w-full">
              <Link href="/login">去登录</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {user && members.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-sm text-muted-foreground">请先添加会员，再创建课包～</p>
            <Button asChild className="w-full">
              <Link href="/members">去添加会员</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {user && members.length > 0 && !isFormOpen ? (
        <Button className="w-full" onClick={() => setIsFormOpen(true)}>
          新增课包
        </Button>
      ) : null}

      {isFormOpen ? <Card>
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShoppingBag className="size-5 text-primary" />
            {editingId ? "编辑课包" : "新增课包"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Field label="会员" error={errors.member_id}>
              <Select value={form.member_id} onChange={(event) => updateField("member_id", event.target.value)}>
                <option value="">请选择会员</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="课包名称" error={errors.package_name}>
              <Input value={form.package_name} placeholder="例如：私教 10 节" onChange={(event) => updateField("package_name", event.target.value)} />
            </Field>
            <Field label="课包类型">
              <Select value={form.package_mode ?? "single"} onChange={(event) => updateField("package_mode", event.target.value)}>
                <option value="single">单一课包</option>
                <option value="bundle">组合课包</option>
              </Select>
            </Field>
            <Field label="这个课包属于哪个瑜伽馆？" error={errors.studio_id}>
              <Select value={form.studio_id ?? ""} onChange={(event) => updateField("studio_id", event.target.value)}>
                <option value="">不选择</option>
                {studios.map((studio) => <option key={studio.id} value={studio.id}>{studio.name}</option>)}
              </Select>
            </Field>
            {(form.package_mode ?? "single") === "single" ? <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="课程类型" error={errors.course_type}>
                <Select value={form.course_type} onChange={(event) => updateField("course_type", event.target.value)}>
                  {Object.entries(courseTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="录入方式">
                <Select value={form.pricing_mode ?? "total_amount"} onChange={(event) => updateField("pricing_mode", event.target.value)}>
                  <option value="total_amount">按总价计算</option>
                  <option value="unit_price">按客单价计算</option>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(form.pricing_mode ?? "total_amount") === "unit_price" ? (
                <Field label="客单价 / 单节成交价" error={errors.unit_price}>
                  <Input type="number" min="0" inputMode="decimal" value={form.unit_price} placeholder="300" onChange={(event) => updateField("unit_price", event.target.value)} />
                </Field>
              ) : (
                <Field label="总成交金额" error={errors.total_amount}>
                  <Input type="number" min="0" inputMode="decimal" value={form.total_amount} placeholder="3000" onChange={(event) => updateField("total_amount", event.target.value)} />
                </Field>
              )}
              <Field label="总课时" error={errors.total_sessions}>
                <Input type="number" min="0" inputMode="numeric" value={form.total_sessions} placeholder="10" onChange={(event) => updateField("total_sessions", event.target.value)} />
              </Field>
            </div>
            <div className="rounded-3xl bg-accent px-4 py-3 text-sm text-primary">
              总成交金额：<span className="font-semibold">¥{totalAmountPreview.toFixed(2)}</span> · 单节成交价：<span className="font-semibold">¥{unitPricePreview.toFixed(2)}</span>
            </div>
            </> : <BundleItemsEditor items={bundleItems} onChange={updateBundleItem} onAdd={addBundleItem} onRemove={removeBundleItem} />}
            <Field label="购买日期" error={errors.purchase_date}>
              <Input type="date" value={form.purchase_date} onChange={(event) => updateField("purchase_date", event.target.value)} />
            </Field>
            <Field label="备注（可选）" error={errors.note}>
              <Textarea value={form.note ?? ""} placeholder="例如：会员偏好、赠课说明" onChange={(event) => updateField("note", event.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              {editingId ? (
                <Button type="button" variant="secondary" onClick={resetForm}>
                  取消编辑
                </Button>
              ) : (
                <Button type="button" variant="secondary" onClick={resetForm}>
                  取消
                </Button>
              )}
              <Button type="submit" disabled={user !== null && members.length === 0}>
                {editingId ? "保存修改" : "保存课包"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card> : null}

      <section className="space-y-3">
        <h2 className="text-base font-semibold">课包列表</h2>
        <div className="grid grid-cols-2 gap-3">
          <Select value={studioFilter} onChange={(event) => setStudioFilter(event.target.value)}>
            <option value="all">全部瑜伽馆</option>
            <option value="unassigned">未归属</option>
            {studios.map((studio) => <option key={studio.id} value={studio.id}>{studio.name}</option>)}
          </Select>
          <Select value={memberFilter} onChange={(event) => setMemberFilter(event.target.value)}>
            <option value="">全部会员</option>
            {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
          </Select>
        </div>
        {visiblePackages.length === 0 ? (
          <EmptyState text={getPackageFilterEmptyMessage(studioFilter, memberFilter)} />
        ) : (
            visiblePackages.map((item) => <PackageCard key={item.id} item={item} items={packageItems.filter((packageItem) => packageItem.package_id === item.id)} members={members} studios={studios} usage={usages[item.id]} classes={classes} expanded={expandedIds.includes(item.id)} onToggle={() => setExpandedIds((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} onEdit={startEdit} onDelete={removePackage} />)
        )}
      </section>
    </div>
  );
}

function PackageCard({
  item,
  items,
  members,
  studios,
  usage,
  classes,
  expanded,
  onToggle,
  onEdit,
  onDelete
}: {
  item: MemberPackage;
  items: PackageItem[];
  members: Member[];
  studios: Studio[];
  usage?: PackageUsage;
  classes: ClassRecord[];
  expanded: boolean;
  onToggle: () => void;
  onEdit: (item: MemberPackage) => void;
  onDelete: (item: MemberPackage) => void;
}) {
  const summary = buildPackageSummary({ item, members, studios, remainingLabel: usage ? getPackageUsageLabel(usage) : "未统计" });
  const relatedClasses = classes.filter((record) => record.package_id === item.id).slice(0, 3);
  const isBundle = items.length > 1;

  return (
    <article className="space-y-4 rounded-3xl border border-white/70 bg-card/90 p-4 shadow-sm">
      <button type="button" className="flex min-h-16 w-full items-start justify-between gap-3 text-left" onClick={onToggle}>
        <div>
          <p className="text-sm text-muted-foreground">{summary.title}</p>
          <h3 className="mt-1 font-medium text-foreground">{summary.subtitle}</h3>
          <p className="mt-1 text-sm font-medium text-primary">{isBundle ? `组合课包｜${items.length} 个项目｜多项目不同单价` : summary.meta}</p>
        </div>
        {expanded ? <ChevronUp className="mt-1 size-5 text-muted-foreground" /> : <ChevronDown className="mt-1 size-5 text-muted-foreground" />}
      </button>
      {usage ? <UsageStrip usage={usage} /> : null}
      {expanded ? (
        <div className="space-y-3 border-t border-white/70 pt-3">
          <div className="flex flex-wrap gap-2">
            <Badge>{courseTypeLabels[item.course_type]}</Badge>
            <Badge>{item.purchase_date}</Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <AmountPill label="总成交金额" value={`¥${item.total_amount.toFixed(2)}`} />
            <AmountPill label="总课时" value={`${item.total_sessions}`} />
            <AmountPill label="已上" value={`${usage?.usedSessions ?? 0}`} />
          </div>
          {items.length > 0 ? (
            <div className="space-y-2 rounded-3xl bg-muted/70 p-3">
              <div className="text-sm font-medium">课包项目</div>
              {items.map((packageItem) => {
                const itemUsage = usage?.itemUsages?.find((usageItem) => usageItem.packageItemId === packageItem.id);
                return <div key={packageItem.id} className="rounded-2xl bg-card/80 px-3 py-2 text-sm text-muted-foreground">{packageItem.item_name} · {packageItem.sessions} 节 · ¥{packageItem.unit_price.toFixed(2)}/节{itemUsage ? ` · ${getPackageUsageLabel(itemUsage)}` : ""}</div>;
              })}
            </div>
          ) : null}
          {relatedClasses.length > 0 ? (
            <div className="rounded-3xl bg-secondary/70 p-3 text-sm text-muted-foreground">
              <div className="mb-2 font-medium text-foreground">最近消课</div>
              <div className="space-y-1">
                {relatedClasses.map((record) => <p key={record.id}>{record.date} · {record.course_name} · {record.hours} 节</p>)}
              </div>
            </div>
          ) : null}
          {item.note ? <p className="rounded-2xl bg-muted/70 px-3 py-2 text-sm text-muted-foreground">{item.note}</p> : null}
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => onEdit(item)}><PenLine className="mr-2 size-4" />编辑</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => onDelete(item)}><Trash2 className="mr-2 size-4" />删除</Button>
          </div>
          <Button asChild variant="secondary" className="w-full">
            <Link href={`/classes?memberId=${item.member_id}&packageId=${item.id}&studioId=${item.studio_id ?? ""}&courseType=private`}>用这个课包记一节课</Link>
          </Button>
        </div>
      ) : null}
    </article>
  );
}

function BundleItemsEditor({ items, onChange, onAdd, onRemove }: { items: Array<ReturnType<typeof emptyPackageItem>>; onChange: (index: number, field: keyof ReturnType<typeof emptyPackageItem>, value: string) => void; onAdd: () => void; onRemove: (index: number) => void }) {
  const totalSessions = items.reduce((sum, item) => sum + Number(item.sessions || 0), 0);
  const totalAmount = items.reduce((sum, item) => sum + Number(item.sessions || 0) * Number(item.unit_price || 0), 0);
  const averagePrice = totalSessions > 0 ? totalAmount / totalSessions : 0;

  return (
    <div className="space-y-3 rounded-3xl bg-secondary/70 p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">组合课包项目</div>
        <Button type="button" size="sm" variant="secondary" onClick={onAdd}>添加项目</Button>
      </div>
      {items.map((item, index) => (
        <div key={index} className="space-y-3 rounded-3xl bg-card/80 p-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="项目名称"><Input value={item.item_name} placeholder="私教课" onChange={(event) => onChange(index, "item_name", event.target.value)} /></Field>
            <Field label="课程类型"><Select value={item.course_type} onChange={(event) => onChange(index, "course_type", event.target.value)}>{Object.entries(courseTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="课时数"><Input type="number" inputMode="decimal" value={item.sessions} onChange={(event) => onChange(index, "sessions", event.target.value)} /></Field>
            <Field label="客单价"><Input type="number" inputMode="decimal" value={item.unit_price} onChange={(event) => onChange(index, "unit_price", event.target.value)} /></Field>
          </div>
          <div className="text-sm text-primary">项目金额：¥{(Number(item.sessions || 0) * Number(item.unit_price || 0)).toFixed(2)}</div>
          <Field label="备注（可选）"><Input value={item.note} onChange={(event) => onChange(index, "note", event.target.value)} /></Field>
          {items.length > 1 ? <Button type="button" size="sm" variant="outline" onClick={() => onRemove(index)}>删除这个项目</Button> : null}
        </div>
      ))}
      <div className="rounded-2xl bg-accent px-3 py-2 text-sm text-primary">合计：¥{totalAmount.toFixed(2)} · {totalSessions} 节 · 平均 ¥{averagePrice.toFixed(2)}/节</div>
    </div>
  );
}

function UsageStrip({ usage }: { usage: PackageUsage }) {
  const progress = usage.totalSessions > 0 ? Math.min(Math.max((usage.usedSessions / usage.totalSessions) * 100, 0), 100) : 0;
  const tone = getPackageUsageTone(usage);

  return (
    <div className="space-y-2 rounded-3xl bg-secondary/70 p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">已上 {usage.usedSessions} 节</span>
        <span className={tone === "error" ? "font-medium text-destructive" : tone === "warning" ? "font-medium text-amber-700" : "font-medium text-primary"}>{getPackageUsageLabel(usage)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-card/80">
        <div className="h-full rounded-full bg-primary/70" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function AmountPill({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-2xl bg-secondary p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={strong ? "font-semibold text-primary" : "font-semibold"}>{value}</div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-3xl border border-dashed bg-card/70 p-6 text-center text-sm text-muted-foreground">{text}</div>;
}

function friendlyError(field: keyof FieldErrors, fallback: string) {
  const messages: FieldErrors = {
    member_id: "请选择会员",
    studio_id: "请选择瑜伽馆",
    package_name: "请输入课包名称",
    course_type: "请选择课程类型",
    total_amount: "成交价不能小于 0",
    unit_price: "请输入客单价 / 单节成交价",
    total_sessions: "总课时需要大于 0",
    purchase_date: "请选择购买日期"
  };
  return messages[field] ?? fallback;
}
