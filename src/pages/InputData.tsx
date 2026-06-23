import { useState } from "react";
import { Platform } from "@/lib/types";
import { addComment } from "@/lib/store";
import { useSettings } from "@/hooks/useComments";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, Save, ArrowRight, X, Download, Loader2 } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";

const platforms: Platform[] = ["Instagram","Facebook","TikTok","YouTube","X/Twitter"];

const InputData = () => {
  const nav = useNavigate();
  const settings = useSettings();
  const [form, setForm] = useState({
    platform: "Instagram" as Platform,
    campaign_name: "",
    post_date: new Date().toISOString().slice(0,10),
    username: "",
    comment_text: "",
    likes: 0, views: 0, shares: 0,
  });
  const [preview, setPreview] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);

  const fetchFromMeta = async () => {
    if (!settings.ig_account_id && !settings.fb_page_id) {
      toast.error("Isi IG Account ID atau FB Page ID di Pengaturan dulu.");
      return;
    }
    setFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke("meta-fetch-comments", {
        body: {
          ig_account_id: settings.ig_account_id,
          fb_page_id: settings.fb_page_id,
          media_limit: 5,
        },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Gagal mengambil komentar");
      const list = data.comments || [];
      if (list.length === 0) {
        toast.warning("Tidak ada komentar ditemukan pada postingan terbaru.");
      } else {
        for (const c of list) addComment(c);
        toast.success(`${list.length} komentar berhasil ditarik dari Meta`);
      }
      if (data.errors) {
        Object.entries(data.errors).forEach(([k, v]) => toast.error(`${k}: ${v}`));
      }
    } catch (e: any) {
      toast.error(e.message || "Gagal terhubung ke Meta Graph API");
    } finally {
      setFetching(false);
    }
  };

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.comment_text || !form.campaign_name) {
      toast.error("Lengkapi campaign & isi komentar");
      return;
    }
    addComment({ ...form, likes: +form.likes, views: +form.views, shares: +form.shares });
    toast.success("Data komentar tersimpan");
    setForm({ ...form, comment_text: "", username: "", likes: 0, views: 0, shares: 0 });
  };

  const handleFile = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "csv") {
      Papa.parse(file, {
        header: true, skipEmptyLines: true,
        complete: (res) => { setPreview(res.data as any[]); toast.success(`Preview ${res.data.length} baris CSV`); }
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const wb = XLSX.read(e.target?.result, { type: "binary" });
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        setPreview(rows as any[]);
        toast.success(`Preview ${rows.length} baris Excel`);
      };
      reader.readAsBinaryString(file);
    } else toast.error("Format file tidak didukung");
  };

  const savePreview = () => {
    if (!preview.length) return;
    let count = 0;
    for (const row of preview) {
      if (!row.comment_text && !row.Comment && !row.comment) continue;
      addComment({
        platform: (row.platform || row.Platform || "Instagram") as Platform,
        campaign_name: row.campaign_name || row.Campaign || "Kampanye Import",
        post_date: row.post_date || row.Date || new Date().toISOString().slice(0,10),
        username: row.username || row.User || "@anonim",
        comment_text: row.comment_text || row.Comment || row.comment || "",
        likes: +(row.likes || row.Likes || 0),
        views: +(row.views || row.Views || 0),
        shares: +(row.shares || row.Shares || 0),
      });
      count++;
    }
    toast.success(`${count} komentar berhasil disimpan`);
    setPreview([]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Manual form */}
      <div className="lg:col-span-3 rounded-xl border bg-card p-6 shadow-elegant">
        <h3 className="text-lg font-bold mb-1">Input Komentar Manual</h3>
        <p className="text-sm text-muted-foreground mb-5">Tambahkan komentar individual untuk dianalisis sistem.</p>
        <form onSubmit={submitManual} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Platform</Label>
            <Select value={form.platform} onValueChange={(v: Platform) => setForm({...form, platform: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{platforms.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Nama Konten / Kampanye</Label>
            <Input value={form.campaign_name} onChange={e=>setForm({...form, campaign_name: e.target.value})} placeholder="Launch Aurum Series" />
          </div>
          <div className="space-y-2">
            <Label>Tanggal Posting</Label>
            <Input type="date" value={form.post_date} onChange={e=>setForm({...form, post_date: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Username</Label>
            <Input value={form.username} onChange={e=>setForm({...form, username: e.target.value})} placeholder="@username" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Isi Komentar</Label>
            <Textarea rows={3} value={form.comment_text} onChange={e=>setForm({...form, comment_text: e.target.value})} placeholder="Tulis komentar yang ingin dianalisis..." />
          </div>
          <div className="space-y-2"><Label>Likes</Label><Input type="number" min={0} value={form.likes} onChange={e=>setForm({...form, likes: +e.target.value})} /></div>
          <div className="space-y-2"><Label>Views</Label><Input type="number" min={0} value={form.views} onChange={e=>setForm({...form, views: +e.target.value})} /></div>
          <div className="space-y-2"><Label>Shares</Label><Input type="number" min={0} value={form.shares} onChange={e=>setForm({...form, shares: +e.target.value})} /></div>
          <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 pt-2">
            <Button type="submit" className="bg-gradient-primary text-white">
              <Save className="h-4 w-4 mr-2" /> Simpan Data
            </Button>
            <Button type="button" variant="outline" onClick={() => nav("/analisis-sentimen")}>
              Lanjut Analisis <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </form>
      </div>

      {/* Upload */}
      <div className="lg:col-span-2 rounded-xl border bg-card p-6 shadow-elegant">
        <h3 className="text-lg font-bold mb-1">Upload CSV / Excel</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Kolom: <code className="text-xs">platform, campaign_name, post_date, username, comment_text, likes, views, shares</code>
        </p>
        <label className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-primary/30 bg-secondary/40 p-8 cursor-pointer hover:bg-secondary transition-colors">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-accent text-white">
            <Upload className="h-5 w-5" />
          </div>
          <div className="text-center">
            <p className="font-semibold">Klik untuk upload</p>
            <p className="text-xs text-muted-foreground">CSV, XLSX, XLS</p>
          </div>
          <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => e.target.files && handleFile(e.target.files[0])} />
        </label>

        {preview.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-success" /> Preview {preview.length} baris
              </p>
              <button onClick={()=>setPreview([])} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
                <X className="h-3 w-3" /> Batal
              </button>
            </div>
            <div className="max-h-48 overflow-auto rounded-lg border text-xs">
              <table className="w-full">
                <thead className="bg-secondary sticky top-0">
                  <tr>{Object.keys(preview[0]).slice(0,5).map(k => <th key={k} className="px-2 py-1.5 text-left font-semibold">{k}</th>)}</tr>
                </thead>
                <tbody>
                  {preview.slice(0,8).map((r,i) => (
                    <tr key={i} className="border-t">
                      {Object.keys(preview[0]).slice(0,5).map(k => <td key={k} className="px-2 py-1.5 truncate max-w-[100px]">{String(r[k] ?? "")}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button onClick={savePreview} className="w-full bg-success text-success-foreground hover:bg-success/90">
              <Save className="h-4 w-4 mr-2" /> Simpan {preview.length} Komentar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InputData;
