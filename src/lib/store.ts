import { SocialComment, Settings, Sentiment, EngagementLevel } from "./types";

const COMMENTS_KEY = "vsa_comments";
const SETTINGS_KEY = "vsa_settings";
const USER_KEY = "vsa_user";

export const defaultSettings: Settings = {
  company_name: "PT Vinix Seven Aurum",
  industry: "Digital Marketing / Business Development",
  positive_keywords: ["bagus","keren","puas","suka","mantap","recommended","cepat","menarik","jelas","informatif","membantu","ramah","oke","top","hebat"],
  negative_keywords: ["buruk","kecewa","lambat","mahal","jelek","tidak puas","komplain","lama","parah","kasar","susah","ribet","gagal","rusak"],
  weights: { likes: 1, views: 0.1, shares: 3 },
  meta_api_token: "",
  ig_account_id: "",
  fb_page_id: "",
  api_connected: false,
};

const seedComments = (): SocialComment[] => {
  const platforms = ["Instagram","Facebook","TikTok","YouTube","X/Twitter"] as const;
  const campaigns = ["Launch Aurum Series","Promo Akhir Tahun","Brand Awareness Q4","Edukasi Produk","Kampanye CSR"];
  const samples = [
    { t: "Kontennya sangat menarik dan informatif, mantap!", l: 320, v: 5400, s: 25 },
    { t: "Pelayanannya lambat dan kurang responsif, kecewa.", l: 12, v: 2200, s: 1 },
    { t: "Informasi yang diberikan cukup jelas.", l: 88, v: 3100, s: 5 },
    { t: "Desain visualnya keren, saya suka banget!", l: 540, v: 12800, s: 60 },
    { t: "Saya kecewa karena respon admin lama sekali.", l: 8, v: 1800, s: 0 },
    { t: "Postingan ini membahas produk terbaru.", l: 42, v: 2800, s: 3 },
    { t: "Produknya recommended, cepat sampai dan ramah!", l: 410, v: 9200, s: 38 },
    { t: "Harganya mahal banget, kualitas biasa saja.", l: 5, v: 1500, s: 1 },
    { t: "Bagus penjelasannya, jadi paham fitur baru.", l: 220, v: 6700, s: 18 },
    { t: "Aplikasi sering error, ribet dipakainya.", l: 3, v: 980, s: 0 },
    { t: "Update terbaru tersedia minggu depan.", l: 60, v: 2100, s: 4 },
    { t: "Mantap, layanan customer service sangat ramah.", l: 290, v: 7100, s: 22 },
    { t: "Pengiriman lambat, packing juga jelek.", l: 6, v: 1100, s: 0 },
    { t: "Konten edukatif, terima kasih sudah berbagi.", l: 175, v: 5200, s: 14 },
    { t: "Webinar besok jam 7 malam, jangan lupa.", l: 33, v: 1900, s: 2 },
    { t: "Top sekali kontennya, ditunggu series berikutnya!", l: 620, v: 15400, s: 78 },
    { t: "Pelayanan kasar, saya komplain tidak ditanggapi.", l: 2, v: 800, s: 0 },
    { t: "Tim marketingnya hebat, kerja cepat dan rapi.", l: 380, v: 8500, s: 30 },
    { t: "Saya rasa fitur ini belum cukup membantu.", l: 18, v: 1700, s: 1 },
    { t: "Promo menarik, harga juga terjangkau.", l: 260, v: 6800, s: 20 },
    { t: "Acara kemarin biasa saja, tidak ada yang spesial.", l: 15, v: 1400, s: 2 },
    { t: "Produk gagal pakai, mengecewakan.", l: 4, v: 950, s: 0 },
  ];
  const now = Date.now();
  return samples.map((s, i) => ({
    id: `c_${i+1}`,
    platform: platforms[i % platforms.length],
    campaign_name: campaigns[i % campaigns.length],
    post_date: new Date(now - (i * 86400000) - Math.random()*86400000).toISOString().slice(0,10),
    username: `@user_${i+1}`,
    comment_text: s.t,
    likes: s.l, views: s.v, shares: s.s,
    sentiment_status: "belum dianalisis",
    created_at: new Date(now - i*3600000).toISOString(),
  }));
};

export const getComments = (): SocialComment[] => {
  const raw = localStorage.getItem(COMMENTS_KEY);
  if (!raw) {
    const seed = seedComments();
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(seed));
    return seed;
  }
  try { return JSON.parse(raw); } catch { return []; }
};

export const saveComments = (c: SocialComment[]) => {
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(c));
  window.dispatchEvent(new Event("vsa-data-change"));
};

export const addComment = (c: Omit<SocialComment, "id" | "created_at" | "sentiment_status">) => {
  const all = getComments();
  const item: SocialComment = {
    ...c,
    id: `c_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
    sentiment_status: "belum dianalisis",
    created_at: new Date().toISOString(),
  };
  saveComments([item, ...all]);
  return item;
};

export const updateComment = (id: string, patch: Partial<SocialComment>) => {
  const all = getComments().map(c => c.id === id ? { ...c, ...patch } : c);
  saveComments(all);
};

export const deleteComment = (id: string) => {
  saveComments(getComments().filter(c => c.id !== id));
};

export const getSettings = (): Settings => {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
    return defaultSettings;
  }
  try { return { ...defaultSettings, ...JSON.parse(raw) }; } catch { return defaultSettings; }
};

export const saveSettings = (s: Settings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  window.dispatchEvent(new Event("vsa-data-change"));
};

export const getUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};

export const setUser = (u: any) => localStorage.setItem(USER_KEY, JSON.stringify(u));
export const clearUser = () => localStorage.removeItem(USER_KEY);

// ============ ANALYSIS LOGIC ============
const stopwords = new Set(["yang","dan","di","ke","dari","untuk","pada","ini","itu","saya","kamu","aku","kami","kita","adalah","dengan","atau","juga","sudah","akan","sangat","banget","sih","deh","aja","saja","tidak","gak","nggak","ga","tak","lah","kok","ya","nya","sekali"]);

export const cleanText = (t: string) =>
  t.toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();

export const tokenize = (t: string) => cleanText(t).split(" ").filter(Boolean);

export const removeStopwords = (tokens: string[]) => tokens.filter(t => !stopwords.has(t));

export const stem = (tokens: string[]) =>
  tokens.map(t => t.replace(/(nya|kan|lah|ku|mu|i)$/,"").replace(/^(me|ber|ter|di|ke|se|pe)/,""));

export const classifyComment = (text: string, settings: Settings): { sentiment: Sentiment; score: number; cleaned: string } => {
  const cleaned = cleanText(text);
  let posCount = 0, negCount = 0;
  for (const kw of settings.positive_keywords) if (cleaned.includes(kw)) posCount++;
  for (const kw of settings.negative_keywords) if (cleaned.includes(kw)) negCount++;
  const total = posCount + negCount;
  let sentiment: Sentiment = "netral";
  let score = 0.5;
  if (total === 0) {
    sentiment = "netral";
    score = 0.55 + Math.random() * 0.1;
  } else if (posCount > negCount) {
    sentiment = "positif";
    score = Math.min(0.98, 0.65 + posCount * 0.1);
  } else if (negCount > posCount) {
    sentiment = "negatif";
    score = Math.min(0.98, 0.65 + negCount * 0.1);
  } else {
    sentiment = "netral";
    score = 0.55;
  }
  return { sentiment, score: Number(score.toFixed(2)), cleaned };
};

export const computeEngagementLevel = (c: SocialComment, settings: Settings): EngagementLevel => {
  const w = settings.weights;
  const score = c.likes * w.likes + c.views * w.views + c.shares * w.shares;
  if (score > 2000) return "Tinggi";
  if (score > 600) return "Sedang";
  return "Rendah";
};

export const buildRecommendation = (c: SocialComment, sentiment: Sentiment, level: EngagementLevel): string => {
  if (sentiment === "positif" && level === "Tinggi") return "Pertahankan gaya konten, jadikan inspirasi kampanye lanjutan, dan optimalkan call-to-action.";
  if (sentiment === "negatif") return "Evaluasi pesan konten, respon komentar negatif dengan cepat, dan perbaiki aspek yang sering dikeluhkan.";
  if (sentiment === "netral") return "Perkuat storytelling, gunakan visual lebih menarik, dan tambahkan CTA untuk meningkatkan interaksi.";
  if (c.views > 5000 && c.likes < c.views * 0.02) return "Perbaiki kualitas hook, caption, dan desain visual agar audiens terdorong berinteraksi.";
  return "Tambahkan pertanyaan terbuka pada caption untuk meningkatkan diskusi.";
};

export const runAnalysisAll = () => {
  const s = getSettings();
  const all = getComments().map(c => {
    const { sentiment, score, cleaned } = classifyComment(c.comment_text, s);
    const level = computeEngagementLevel(c, s);
    return {
      ...c,
      sentiment_status: sentiment,
      confidence_score: score,
      engagement_level: level,
      cleaned_text: cleaned,
      recommendation: buildRecommendation(c, sentiment, level),
    };
  });
  saveComments(all);
  // simulated metrics
  const total = all.length || 1;
  const accuracy = 0.82 + Math.random() * 0.1;
  return {
    total,
    positif: all.filter(c=>c.sentiment_status==="positif").length,
    negatif: all.filter(c=>c.sentiment_status==="negatif").length,
    netral: all.filter(c=>c.sentiment_status==="netral").length,
    accuracy: Number(accuracy.toFixed(3)),
    precision: Number((accuracy - 0.03 + Math.random()*0.02).toFixed(3)),
    recall: Number((accuracy - 0.05 + Math.random()*0.02).toFixed(3)),
    f1: Number((accuracy - 0.04 + Math.random()*0.02).toFixed(3)),
  };
};
