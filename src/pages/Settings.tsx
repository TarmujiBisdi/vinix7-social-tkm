import { useState } from "react";
import { useSettings } from "@/hooks/useComments";
import { saveSettings } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Building2, KeyRound, Sparkles, Save, Plug, Info } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const Settings = () => {
  const initial = useSettings();
  const { user } = useAuth();
  const [s, setS] = useState(initial);
  const [posKw, setPosKw] = useState(initial.positive_keywords.join(", "));
  const [negKw, setNegKw] = useState(initial.negative_keywords.join(", "));

  const save = () => {
    saveSettings({
      ...s,
      positive_keywords: posKw.split(",").map(k=>k.trim()).filter(Boolean),
      negative_keywords: negKw.split(",").map(k=>k.trim()).filter(Boolean),
    });
    toast.success("Pengaturan tersimpan");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-elegant">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-primary text-white"><Building2 className="h-5 w-5" /></div>
          <div><h3 className="font-bold">Profil Perusahaan</h3><p className="text-xs text-muted-foreground">Informasi utama brand</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Nama Perusahaan</Label><Input value={s.company_name} onChange={e=>setS({...s, company_name: e.target.value})} /></div>
          <div className="space-y-2"><Label>Industri</Label><Input value={s.industry} onChange={e=>setS({...s, industry: e.target.value})} /></div>
          <div className="space-y-2 md:col-span-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-accent text-white"><Sparkles className="h-6 w-6" /></div>
              <p className="text-xs text-muted-foreground">Placeholder logo. Upload custom logo akan tersedia di versi mendatang.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-elegant">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-primary"><KeyRound className="h-5 w-5" /></div>
          <div><h3 className="font-bold">Akun Pengguna</h3><p className="text-xs text-muted-foreground">Identitas akun yang sedang login</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2"><Label>Nama</Label><Input value={user?.name ?? ""} readOnly /></div>
          <div className="space-y-2"><Label>Email</Label><Input value={user?.email ?? ""} readOnly /></div>
          <div className="space-y-2"><Label>Role</Label><Input value={user?.role ?? ""} readOnly /></div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-elegant">
        <h3 className="font-bold mb-1">Kata Kunci Sentimen</h3>
        <p className="text-xs text-muted-foreground mb-4">Pisahkan dengan koma. Digunakan oleh klasifikasi Naive Bayes berbasis kata kunci.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label className="text-success">Kata Positif</Label><Textarea rows={3} value={posKw} onChange={e=>setPosKw(e.target.value)} /></div>
          <div className="space-y-2"><Label className="text-destructive">Kata Negatif</Label><Textarea rows={3} value={negKw} onChange={e=>setNegKw(e.target.value)} /></div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-elegant">
        <h3 className="font-bold mb-1">Bobot Engagement</h3>
        <p className="text-xs text-muted-foreground mb-4">Digunakan untuk menghitung level engagement (Rendah / Sedang / Tinggi).</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2"><Label>Bobot Likes</Label><Input type="number" step="0.1" value={s.weights.likes} onChange={e=>setS({...s, weights: {...s.weights, likes: +e.target.value}})} /></div>
          <div className="space-y-2"><Label>Bobot Views</Label><Input type="number" step="0.1" value={s.weights.views} onChange={e=>setS({...s, weights: {...s.weights, views: +e.target.value}})} /></div>
          <div className="space-y-2"><Label>Bobot Shares</Label><Input type="number" step="0.1" value={s.weights.shares} onChange={e=>setS({...s, weights: {...s.weights, shares: +e.target.value}})} /></div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-elegant">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10 text-accent"><Plug className="h-5 w-5" /></div>
          <div className="flex-1"><h3 className="font-bold">Integrasi API (Placeholder)</h3><p className="text-xs text-muted-foreground">Konfigurasi token untuk pengambilan komentar otomatis</p></div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold ${s.api_connected ? "text-success" : "text-muted-foreground"}`}>{s.api_connected ? "Terhubung" : "Belum"}</span>
            <Switch checked={s.api_connected} onCheckedChange={(v)=>setS({...s, api_connected: v})} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2 md:col-span-3"><Label>Meta Graph API Token</Label><Input type="password" value={s.meta_api_token} onChange={e=>setS({...s, meta_api_token: e.target.value})} placeholder="EAAxxxxxx..." /></div>
          <div className="space-y-2"><Label>Instagram Business Account ID</Label><Input value={s.ig_account_id} onChange={e=>setS({...s, ig_account_id: e.target.value})} placeholder="178414xxxx" /></div>
          <div className="space-y-2"><Label>Facebook Page ID</Label><Input value={s.fb_page_id} onChange={e=>setS({...s, fb_page_id: e.target.value})} placeholder="102345xxxx" /></div>
        </div>
        <div className="mt-4 flex gap-2 rounded-lg border border-dashed bg-secondary/50 p-3 text-xs text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-accent" />
          Integrasi API dapat dikembangkan lebih lanjut untuk mengambil komentar media sosial secara otomatis melalui Meta Graph API.
        </div>
      </div>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <Button onClick={save} size="lg" className="bg-gradient-primary text-white shadow-glow">
          <Save className="h-4 w-4 mr-2" /> Simpan Pengaturan
        </Button>
      </div>
    </div>
  );
};

export default Settings;
