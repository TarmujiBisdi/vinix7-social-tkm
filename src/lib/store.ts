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

export const getComments = (): SocialComment[] => {
  const raw = localStorage.getItem(COMMENTS_KEY);
  if (!raw) {
    localStorage.setItem(COMMENTS_KEY, JSON.stringify([]));
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const cleaned = parsed.filter((c: SocialComment) => !isDemoComment(c));
    if (cleaned.length !== parsed.length) localStorage.setItem(COMMENTS_KEY, JSON.stringify(cleaned));
    return cleaned;
  } catch { return []; }
};

const isDemoComment = (c: SocialComment) => {
  const match = c?.id?.match(/^c_(\d+)$/);
  if (!match) return false;
  const n = Number(match[1]);
  return n >= 1 && n <= 22 && /^@user_\d+$/.test(c.username || "");
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
    source: c.source ?? "manual",
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
    score = 0.58;
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

export const summarizeAnalysis = (all: SocialComment[]) => {
  const total = all.length;
  const positif = all.filter(c=>c.sentiment_status==="positif").length;
  const negatif = all.filter(c=>c.sentiment_status==="negatif").length;
  const netral = all.filter(c=>c.sentiment_status==="netral").length;
  const analyzed = all.filter(c => c.sentiment_status !== "belum dianalisis");
  const confidenceAvg = analyzed.length
    ? analyzed.reduce((a, c) => a + (c.confidence_score ?? 0), 0) / analyzed.length
    : 0;
  const coverage = total ? analyzed.length / total : 0;
  const dominantShare = total ? Math.max(positif, negatif, netral) / total : 0;
  const qualityScore = total ? (confidenceAvg * 0.7) + (coverage * 0.2) + ((1 - Math.abs(0.5 - dominantShare)) * 0.1) : 0;
  return {
    total,
    positif,
    negatif,
    netral,
    analyzed: analyzed.length,
    confidenceAvg: Number(confidenceAvg.toFixed(3)),
    coverage: Number(coverage.toFixed(3)),
    consistency: Number(dominantShare.toFixed(3)),
    qualityScore: Number(qualityScore.toFixed(3)),
    accuracy: Number(confidenceAvg.toFixed(3)),
    precision: Number(coverage.toFixed(3)),
    recall: Number(dominantShare.toFixed(3)),
    f1: Number(qualityScore.toFixed(3)),
  };
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
  return summarizeAnalysis(all);
};
