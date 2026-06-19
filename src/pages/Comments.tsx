import { useMemo, useState } from "react";
import { useComments } from "@/hooks/useComments";
import { deleteComment } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SentimentBadge } from "@/components/SentimentBadge";
import { Button } from "@/components/ui/button";
import { Trash2, Eye, Search, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SocialComment } from "@/lib/types";

const Comments = () => {
  const comments = useComments();
  const [q, setQ] = useState("");
  const [plat, setPlat] = useState("all");
  const [stat, setStat] = useState("all");
  const [detail, setDetail] = useState<SocialComment | null>(null);

  const filtered = useMemo(() => comments.filter(c => {
    if (q && !(c.comment_text.toLowerCase().includes(q.toLowerCase()) || c.username.toLowerCase().includes(q.toLowerCase()) || c.campaign_name.toLowerCase().includes(q.toLowerCase()))) return false;
    if (plat !== "all" && c.platform !== plat) return false;
    if (stat !== "all" && c.sentiment_status !== stat) return false;
    return true;
  }), [comments, q, plat, stat]);

  const remove = (id: string) => {
    deleteComment(id);
    toast.success("Komentar dihapus");
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card p-5 shadow-elegant flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari komentar, username, kampanye..." value={q} onChange={e=>setQ(e.target.value)} className="pl-9" />
        </div>
        <Select value={plat} onValueChange={setPlat}>
          <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Platform" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Platform</SelectItem>
            {["Instagram","Facebook","TikTok","YouTube","X/Twitter"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={stat} onValueChange={setStat}>
          <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="positif">Positif</SelectItem>
            <SelectItem value="negatif">Negatif</SelectItem>
            <SelectItem value="netral">Netral</SelectItem>
            <SelectItem value="belum dianalisis">Belum Dianalisis</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-card shadow-elegant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Platform</th>
                <th className="px-4 py-3 text-left">Campaign</th>
                <th className="px-4 py-3 text-left">Tanggal</th>
                <th className="px-4 py-3 text-left">Username</th>
                <th className="px-4 py-3 text-left">Komentar</th>
                <th className="px-4 py-3 text-right">Likes</th>
                <th className="px-4 py-3 text-right">Views</th>
                <th className="px-4 py-3 text-right">Shares</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-16 text-center text-muted-foreground">
                  <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  Tidak ada data sesuai filter.
                </td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="border-t hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.id.slice(0,8)}</td>
                  <td className="px-4 py-3"><span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{c.platform}</span></td>
                  <td className="px-4 py-3">{c.campaign_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.post_date}</td>
                  <td className="px-4 py-3 text-accent">{c.username}</td>
                  <td className="px-4 py-3 max-w-xs truncate" title={c.comment_text}>{c.comment_text}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.likes.toLocaleString("id-ID")}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.views.toLocaleString("id-ID")}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.shares.toLocaleString("id-ID")}</td>
                  <td className="px-4 py-3"><SentimentBadge s={c.sentiment_status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={()=>setDetail(c)}><Eye className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={()=>remove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t bg-secondary/30 px-4 py-2 text-xs text-muted-foreground">
          Menampilkan {filtered.length} dari {comments.length} komentar
        </div>
      </div>

      <Dialog open={!!detail} onOpenChange={(o)=>!o && setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Detail Komentar</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{detail.platform}</span>
                <SentimentBadge s={detail.sentiment_status} />
              </div>
              <div><span className="text-muted-foreground">Campaign:</span> <b>{detail.campaign_name}</b></div>
              <div><span className="text-muted-foreground">Username:</span> <b>{detail.username}</b></div>
              <div><span className="text-muted-foreground">Tanggal:</span> {detail.post_date}</div>
              <div className="rounded-lg border bg-secondary/40 p-3 leading-relaxed">{detail.comment_text}</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-accent/10 p-2"><p className="text-xs text-muted-foreground">Likes</p><b>{detail.likes}</b></div>
                <div className="rounded-md bg-primary/10 p-2"><p className="text-xs text-muted-foreground">Views</p><b>{detail.views}</b></div>
                <div className="rounded-md bg-success/10 p-2"><p className="text-xs text-muted-foreground">Shares</p><b>{detail.shares}</b></div>
              </div>
              {detail.recommendation && (
                <div className="rounded-lg border-l-4 border-accent bg-accent/5 p-3 text-sm">
                  <p className="font-semibold mb-1">Rekomendasi</p>{detail.recommendation}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Comments;
