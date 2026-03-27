"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Trash2, Plus, Save, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

const LOCALES = ["zh", "en"] as const;
const LOCALE_LABELS: Record<string, string> = { zh: "中文", en: "English" };

interface AttributeOption {
  id: string;
  value: string;
  color: string | null;
}

interface AttributeData {
  id: string;
  key: string;
  name: Record<string, string>;
  type: string;
  unit: string | null;
  scope: string;
  isHighlight: boolean;
  isFilterable: boolean;
  options: AttributeOption[];
}

interface AttributeFormProps {
  initialData?: AttributeData;
}

export function AttributeForm({ initialData }: AttributeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [newOption, setNewOption] = useState("");
  const [newColor, setNewColor] = useState("");

  const [form, setForm] = useState({
    key: initialData?.key || "",
    type: initialData?.type || "TEXT",
    unit: initialData?.unit || "",
    scope: initialData?.scope || "PRODUCT",
    isHighlight: initialData?.isHighlight ?? false,
    isFilterable: initialData?.isFilterable ?? false,
    names: {
      zh: (initialData?.name as Record<string, string>)?.zh || "",
      en: (initialData?.name as Record<string, string>)?.en || "",
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.key || !form.names.zh) {
      toast.error("请填写Key和中文名称");
      return;
    }
    setLoading(true);

    const payload = {
      key: form.key,
      name: { zh: form.names.zh, en: form.names.en },
      type: form.type,
      unit: form.unit || undefined,
      scope: form.scope,
      isHighlight: form.isHighlight,
      isFilterable: form.isFilterable,
    };

    const url = initialData ? `/api/attributes/${initialData.id}` : "/api/attributes";
    const method = initialData ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok) {
      toast.success(initialData ? "属性已更新" : "属性已创建");
      router.push("/admin/attributes");
    } else {
      toast.error(data.error || "操作失败");
    }
    setLoading(false);
  };

  const handleAddOption = async () => {
    if (!initialData || !newOption.trim()) return;
    const res = await fetch(`/api/attributes/${initialData.id}/options`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: newOption.trim(), color: newColor || undefined }),
    });
    if (res.ok) {
      toast.success("选项已添加");
      setNewOption("");
      setNewColor("");
      router.refresh();
      // Reload page to get updated options
      window.location.reload();
    } else {
      const data = await res.json();
      toast.error(data.error || "添加失败");
    }
  };

  const handleDeleteOption = async (optionId: string) => {
    const res = await fetch(`/api/attributes/${initialData!.id}/options?optionId=${optionId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("选项已删除");
      window.location.reload();
    } else toast.error("删除失败");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/attributes"><ArrowLeft className="w-4 h-4 mr-1" />返回</Link>
        </Button>
        <h1 className="text-2xl font-bold">{initialData ? "编辑属性" : "新建属性"}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* 左列: 基本字段 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base border-l-4 border-blue-500 pl-3">基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Key <span className="text-red-500">*</span></Label>
                <Input
                  value={form.key}
                  onChange={(e) => setForm({ ...form, key: e.target.value })}
                  placeholder="power_consumption"
                  disabled={loading}
                />
                <p className="text-xs text-slate-400">小写字母、数字和下划线</p>
              </div>

              <div className="space-y-2">
                <Label>作用域</Label>
                <Select value={form.scope} onValueChange={(v) => v && setForm({ ...form, scope: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRODUCT">产品级</SelectItem>
                    <SelectItem value="VARIANT">变体级</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>类型</Label>
                <Select value={form.type} onValueChange={(v) => v && setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEXT">文本</SelectItem>
                    <SelectItem value="NUMBER">数字</SelectItem>
                    <SelectItem value="SELECT">选择</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>单位</Label>
                <Input
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="W, lm, K..."
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">高亮显示</p>
                  <p className="text-xs text-slate-500">在产品页面显示为快速参数标签</p>
                </div>
                <Switch checked={form.isHighlight} onCheckedChange={(v) => setForm({ ...form, isHighlight: v })} />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">可筛选</p>
                  <p className="text-xs text-slate-500">在搜索和分类页面作为筛选条件</p>
                </div>
                <Switch checked={form.isFilterable} onCheckedChange={(v) => setForm({ ...form, isFilterable: v })} />
              </div>
            </CardContent>
          </Card>

          {/* 右列: 多语言名称 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base border-l-4 border-blue-500 pl-3">多语言名称</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="zh">
                <TabsList>
                  {LOCALES.map((lang) => (
                    <TabsTrigger key={lang} value={lang} className="uppercase">
                      {LOCALE_LABELS[lang]}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {LOCALES.map((lang) => (
                  <TabsContent key={lang} value={lang} className="mt-4">
                    <div className="space-y-2">
                      <Label>名称 ({LOCALE_LABELS[lang]}) {lang === "zh" && <span className="text-red-500">*</span>}</Label>
                      <Input
                        value={form.names[lang]}
                        onChange={(e) => setForm({ ...form, names: { ...form.names, [lang]: e.target.value } })}
                        placeholder={lang === "zh" ? "例如：功率" : "e.g. Power"}
                        disabled={loading}
                      />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <Button type="submit" disabled={loading} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {initialData ? "保存" : "创建"}
        </Button>
      </form>

      {/* 选项管理 (仅编辑时且类型为SELECT) */}
      {initialData && initialData.type === "SELECT" && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">选项管理</h3>
            <p className="text-sm text-slate-500">管理 SELECT 类型属性的可选值</p>

            <div className="flex gap-4 items-end">
              <div className="space-y-1">
                <Label className="text-sm">选项值</Label>
                <Input
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="输入选项值"
                  className="w-48"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">颜色(可选)</Label>
                <div className="flex gap-2">
                  <Input
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    placeholder="#RRGGBB"
                    className="w-24"
                  />
                  <div className="relative w-10 h-10 overflow-hidden rounded border cursor-pointer">
                    <input
                      type="color"
                      value={newColor || "#000000"}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 m-0 border-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              <Button type="button" onClick={handleAddOption} variant="secondary">
                <Plus className="w-4 h-4 mr-1" /> 添加
              </Button>
            </div>

            <div className="rounded-lg border bg-white p-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {initialData.options.map((opt) => (
                <div key={opt.id} className="flex items-center justify-between rounded-lg border p-2.5">
                  <div className="flex items-center gap-2">
                    {opt.color && (
                      <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: opt.color }} />
                    )}
                    <span className="text-sm font-medium">{opt.value}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => handleDeleteOption(opt.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
              {initialData.options.length === 0 && (
                <div className="col-span-full text-center text-sm text-slate-400 py-4">暂无选项，请添加</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
