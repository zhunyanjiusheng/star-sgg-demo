import React, { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  Image as ImageIcon,
  Bot,
  Send,
  Network,
  MapPin,
  Hash,
  Tags,
  GitBranch,
  FileJson,
  Brain,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Database,
  Eye,
  RefreshCw,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const sampleGraph = {
  objects: [
    { id: "o1", label: "airplane", x: 22, y: 28, box: [18, 23, 30, 35] },
    { id: "o2", label: "airplane", x: 48, y: 34, box: [44, 29, 57, 42] },
    { id: "o3", label: "apron", x: 36, y: 62, box: [15, 51, 68, 77] },
    { id: "o4", label: "taxiway", x: 78, y: 58, box: [67, 52, 92, 65] },
    { id: "o5", label: "boarding_bridge", x: 60, y: 18, box: [54, 13, 68, 24] },
  ],
  relations: [
    { source: "o1", target: "o3", predicate: "parallelly parked on" },
    { source: "o2", target: "o3", predicate: "isolatedly parked on" },
    { source: "o1", target: "o2", predicate: "parked alongside with" },
    { source: "o5", target: "o3", predicate: "over" },
    { source: "o4", target: "o3", predicate: "adjacent" },
  ],
};

const sggQuestions = [
  {
    key: "category",
    icon: Tags,
    title: "SGG 的类别问题",
    prompt: "图像中包含哪些 SGG 对象类别？",
    answer: "检测到 airplane、apron、taxiway、boarding_bridge 等类别。",
  },
  {
    key: "count",
    icon: Hash,
    title: "SGG 的数量问题",
    prompt: "图像中每类目标数量是多少？",
    answer: "当前示例中 airplane: 2，apron: 1，taxiway: 1，boarding_bridge: 1。",
  },
  {
    key: "location",
    icon: MapPin,
    title: "SGG 的位置问题",
    prompt: "目标分别位于图片什么位置？",
    answer: "airplane 主要位于左上和中上区域，apron 位于中下区域，taxiway 位于右下区域。",
  },
  {
    key: "relationship",
    icon: GitBranch,
    title: "SGG 的关系问题",
    prompt: "目标之间有哪些关系？",
    answer: "airplane 与 apron 存在 parked on 关系，两个 airplane 存在 parked alongside with 关系，taxiway 与 apron 存在 adjacent 关系。",
  },
];

const defaultJsonQuestion = `What is the relationship between the airplane and the apron in the image?
A. The airplane is isolatedly parked on the apron
B. The airplane is parallelly parked on the apron
C. The airplane is randomly parked on the apron
D. The airplane is over the apron.
Answer with the option's letter from the given choices directly.`;

function classNames(...items) {
  return items.filter(Boolean).join(" ");
}

async function postJson(path, payload) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function postForm(path, formData) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function UploadPanel({ imageUrl, fileName, onUpload, onRunSgg, loading }) {
  const inputRef = useRef(null);

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-700">Image Input</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">上传图片并生成 SGG</h2>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
          <ImageIcon className="h-6 w-6" />
        </div>
      </div>

      <button
        onClick={() => inputRef.current?.click()}
        className="group flex min-h-[330px] w-full items-center justify-center overflow-hidden rounded-[1.5rem] border-2 border-dashed border-slate-300 bg-slate-50 transition hover:border-cyan-400 hover:bg-cyan-50/60"
      >
        {imageUrl ? (
          <div className="relative h-full w-full">
            <img src={imageUrl} alt="Uploaded satellite" className="h-[330px] w-full object-cover" />
            <div className="absolute left-4 top-4 rounded-2xl bg-slate-950/75 px-4 py-2 text-sm font-bold text-white backdrop-blur">
              {fileName || "uploaded image"}
            </div>
          </div>
        ) : (
          <div className="px-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-cyan-700 shadow-sm transition group-hover:scale-105">
              <Upload className="h-8 w-8" />
            </div>
            <p className="mt-5 text-lg font-black text-slate-900">点击上传遥感图片</p>
            <p className="mt-2 text-sm text-slate-500">支持 PNG / JPG / JPEG。上传后可请求后端生成 SGG 检测图与结构图。</p>
          </div>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
        }}
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={onRunSgg}
          disabled={!imageUrl || loading}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Network className="h-4 w-4" />}
          生成 SGG 结构图
        </button>
        <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" /> 前端已预留 /api/sgg 接口
        </div>
      </div>
    </div>
  );
}

function SggGraph({ graph, graphImageUrl, loading }) {
  const nodeMap = useMemo(() => Object.fromEntries(graph.objects.map((o) => [o.id, o])), [graph]);

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">SGG Output</p>
          <h2 className="mt-1 text-2xl font-black">图片标注 + 结构图</h2>
        </div>
        <Database className="h-7 w-7 text-cyan-300" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="relative min-h-[315px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-900">
          {graphImageUrl ? (
            <img src={graphImageUrl} alt="SGG result" className="h-[315px] w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(56,189,248,.18),transparent_30%),radial-gradient(circle_at_80%_75%,rgba(16,185,129,.16),transparent_30%)]" />
          )}
          {!graphImageUrl && (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full opacity-90">
              <path d="M6 68 C23 50 40 72 58 48 C70 33 83 45 95 31" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="3" />
              <path d="M7 24 C31 11 54 25 91 18" fill="none" stroke="rgba(34,211,238,.24)" strokeWidth="2" />
              {graph.objects.map((o, idx) => (
                <g key={o.id}>
                  <rect x={o.box[0]} y={o.box[1]} width={o.box[2] - o.box[0]} height={o.box[3] - o.box[1]} fill="none" stroke={idx % 2 ? "#67e8f9" : "#fbbf24"} strokeWidth="0.8" />
                  <text x={o.box[0]} y={o.box[1] - 1.5} fill="white" fontSize="3.2" fontWeight="700">{o.label}</text>
                </g>
              ))}
            </svg>
          )}
          <div className="absolute bottom-4 left-4 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2 text-sm text-slate-200 backdrop-blur">
            {loading ? "正在生成检测图..." : "SGG 检测结果预览"}
          </div>
        </div>

        <div className="relative min-h-[315px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-white p-4 text-slate-950">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
            {graph.relations.map((r, idx) => {
              const s = nodeMap[r.source];
              const t = nodeMap[r.target];
              if (!s || !t) return null;
              const midX = (s.x + t.x) / 2;
              const midY = (s.y + t.y) / 2;
              return (
                <g key={`${r.source}-${r.target}-${idx}`}>
                  <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke={idx % 2 ? "#0891b2" : "#e11d48"} strokeWidth="0.8" strokeDasharray={idx % 2 ? "" : "2 2"} />
                  <rect x={midX - 12} y={midY - 4} width="24" height="8" rx="3" fill="white" stroke="#e2e8f0" />
                  <text x={midX} y={midY + 1.5} textAnchor="middle" fontSize="2.6" fill="#334155" fontWeight="700">{r.predicate}</text>
                </g>
              );
            })}
          </svg>

          {graph.objects.map((o, idx) => (
            <motion.div
              key={o.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-slate-950 px-3 py-1.5 text-xs font-black text-white shadow-lg"
              style={{ left: `${o.x}%`, top: `${o.y}%` }}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.08 }}
            >
              {o.label}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-slate-400">Objects</p>
          <p className="mt-1 text-2xl font-black">{graph.objects.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-slate-400">Relations</p>
          <p className="mt-1 text-2xl font-black">{graph.relations.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-slate-400">Mode</p>
          <p className="mt-1 text-lg font-black">STAR-SGG Demo</p>
        </div>
      </div>
    </div>
  );
}

function RobotQaPanel({ answers, activeKey, onAsk, loadingKey }) {
  const activeQuestion = sggQuestions.find((q) => q.key === activeKey) || sggQuestions[0];

  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
          <div className="flex items-center gap-4">
            <motion.div
              className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-500/20"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2.2, repeat: Infinity }}
            >
              <Bot className="h-8 w-8" />
            </motion.div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-700">SGG Assistant</p>
              <h2 className="text-3xl font-black text-slate-950">选择四类 SGG 问题</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {sggQuestions.map((q) => {
              const Icon = q.icon;
              const selected = activeKey === q.key;
              return (
                <button
                  key={q.key}
                  onClick={() => onAsk(q)}
                  className={classNames(
                    "rounded-[1.5rem] border p-5 text-left transition hover:-translate-y-0.5",
                    selected ? "border-cyan-300 bg-cyan-50 shadow-lg shadow-cyan-100" : "border-slate-200 bg-slate-50 hover:bg-white"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={classNames("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", selected ? "bg-cyan-500 text-white" : "bg-white text-slate-700")}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-950">{q.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{q.prompt}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-400">机器人回答</p>
                <h3 className="text-xl font-black">{activeQuestion.title}</h3>
              </div>
            </div>
            <Sparkles className="h-6 w-6 text-cyan-300" />
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-bold text-cyan-200">问题</p>
            <p className="mt-2 leading-7 text-slate-100">{activeQuestion.prompt}</p>
          </div>

          <div className="mt-4 min-h-[190px] rounded-[1.5rem] border border-white/10 bg-white p-5 text-slate-900">
            <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-500">
              {loadingKey === activeQuestion.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              Answer
            </div>
            <p className="leading-8">{loadingKey === activeQuestion.key ? "正在请求后端 /api/sgg-qa ..." : answers[activeQuestion.key] || activeQuestion.answer}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function QuestionCard({ title, icon: Icon, accent, children }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
      <div className="mb-5 flex items-center gap-3">
        <div className={classNames("flex h-12 w-12 items-center justify-center rounded-2xl text-white", accent)}>
          <Icon className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-black text-slate-950">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function BottomQa({ jsonQuestion, setJsonQuestion, jsonAnswer, setJsonAnswer, commonQuestion, setCommonQuestion, commonAnswer, setCommonAnswer, selectedImageName }) {
  const [jsonLoading, setJsonLoading] = useState(false);
  const [commonLoading, setCommonLoading] = useState(false);

  const askJson = async () => {
    setJsonLoading(true);
    try {
      const data = await postJson("/api/kg-rag", {
        question: jsonQuestion,
        image: selectedImageName,
      });
      setJsonAnswer(data.answer || data.predicted_option || JSON.stringify(data, null, 2));
    } catch (err) {
      setJsonAnswer("演示模式答案：B。这里预留给 kg_rag 流程，后端应接收 JSON 中的问题，执行 KG 检索 + 关系匹配，并返回 predicted_option / answer / retrieved_context。");
    } finally {
      setJsonLoading(false);
    }
  };

  const askCommon = async () => {
    setCommonLoading(true);
    try {
      const data = await postJson("/api/common-vqa", {
        question: commonQuestion,
        image: selectedImageName,
      });
      setCommonAnswer(data.answer || JSON.stringify(data, null, 2));
    } catch (err) {
      setCommonAnswer("演示模式答案：图片中可见飞机、停机坪、滑行道以及登机桥等遥感场景目标。真实部署时这里应调用视觉大模型或图像理解接口。");
    } finally {
      setCommonLoading(false);
    }
  };

  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-12 pt-4 lg:grid-cols-2">
      <QuestionCard title="JSON 问题：走 kg_rag 流程" icon={FileJson} accent="bg-gradient-to-br from-violet-500 to-fuchsia-500">
        <p className="mb-3 text-sm leading-6 text-slate-600">这里用于读取 `2641.json` 中的问题，后端接口建议对接你的 `kg_rag1(2).py`，返回选项字母、检索到的关系上下文和解释。</p>
        <textarea
          value={jsonQuestion}
          onChange={(e) => setJsonQuestion(e.target.value)}
          className="min-h-[155px] w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 outline-none focus:border-violet-400"
        />
        <div className="mt-4 flex items-center gap-3">
          <button onClick={askJson} disabled={jsonLoading} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white disabled:opacity-50">
            {jsonLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            提交到 kg_rag
          </button>
          <span className="text-sm text-slate-500">接口：POST /api/kg-rag</span>
        </div>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-2 text-sm font-black text-slate-500">输出答案</p>
          <pre className="whitespace-pre-wrap text-sm leading-7 text-slate-800">{jsonAnswer || "等待 kg_rag 输出..."}</pre>
        </div>
      </QuestionCard>

      <QuestionCard title="常识问题：图片中有什么东西" icon={Brain} accent="bg-gradient-to-br from-emerald-500 to-teal-500">
        <p className="mb-3 text-sm leading-6 text-slate-600">这里用于问开放式常识问题，例如“图片中有什么东西？”。后端可接视觉大模型，也可先用 SGG 对象类别生成回答。</p>
        <textarea
          value={commonQuestion}
          onChange={(e) => setCommonQuestion(e.target.value)}
          className="min-h-[155px] w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 outline-none focus:border-emerald-400"
        />
        <div className="mt-4 flex items-center gap-3">
          <button onClick={askCommon} disabled={commonLoading} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white disabled:opacity-50">
            {commonLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            询问图片常识
          </button>
          <span className="text-sm text-slate-500">接口：POST /api/common-vqa</span>
        </div>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-2 text-sm font-black text-slate-500">输出答案</p>
          <pre className="whitespace-pre-wrap text-sm leading-7 text-slate-800">{commonAnswer || "等待视觉问答输出..."}</pre>
        </div>
      </QuestionCard>
    </section>
  );
}

export default function App() {
  const [imageUrl, setImageUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [graph, setGraph] = useState(sampleGraph);
  const [graphImageUrl, setGraphImageUrl] = useState("");
  const [sggLoading, setSggLoading] = useState(false);
  const [activeKey, setActiveKey] = useState("category");
  const [answers, setAnswers] = useState({});
  const [loadingKey, setLoadingKey] = useState("");
  const [jsonQuestion, setJsonQuestion] = useState(defaultJsonQuestion);
  const [jsonAnswer, setJsonAnswer] = useState("");
  const [commonQuestion, setCommonQuestion] = useState("图片中有什么东西？");
  const [commonAnswer, setCommonAnswer] = useState("");

  const handleUpload = (file) => {
    setFileName(file.name);
    setImageUrl(URL.createObjectURL(file));
    setGraphImageUrl("");
    setJsonAnswer("");
    setCommonAnswer("");
  };

  const runSgg = async () => {
    setSggLoading(true);
    try {
      const input = document.querySelector('input[type="file"]');
      const file = input?.files?.[0];
      const formData = new FormData();
      if (file) formData.append("image", file);
      const data = await postForm("/api/sgg", formData);
      if (data.graph) {
          setGraph(data.graph);
        }

      if (data.graphImageUrl) {
          const fullUrl = data.graphImageUrl.startsWith("http")
            ? data.graphImageUrl
            : `${API_BASE}${data.graphImageUrl}`;
          setGraphImageUrl(fullUrl);
        }
    } catch (err) {
      setGraph(sampleGraph);
      setGraphImageUrl("");
    } finally {
      setSggLoading(false);
    }
  };

  const askSggQuestion = async (question) => {
    setActiveKey(question.key);
    setLoadingKey(question.key);
    try {
      const data = await postJson("/api/sgg-qa", {
        type: question.key,
        question: question.prompt,
        graph,
        image: fileName,
      });
      setAnswers((prev) => ({ ...prev, [question.key]: data.answer || JSON.stringify(data, null, 2) }));
    } catch (err) {
      setAnswers((prev) => ({ ...prev, [question.key]: question.answer }));
    } finally {
      setLoadingKey("");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(56,189,248,.24),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(16,185,129,.18),transparent_28%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
            <Sparkles className="h-4 w-4" /> STAR-SGG Visual Question Answering Demo
          </div>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_.85fr] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-5xl font-black leading-tight tracking-tight md:text-7xl">
                SGG 图像解析与 <span className="bg-gradient-to-r from-cyan-300 via-emerald-300 to-amber-200 bg-clip-text text-transparent">KG-RAG 问答</span>
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
                上传遥感图片，展示检测结果与 Scene Graph，再围绕类别、数量、位置、关系四类问题进行机器人问答；底部支持 JSON 题目走 kg_rag 流程，并支持常识型图像问答。
              </p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="font-black text-cyan-200">后端接口规划</p>
              <div className="mt-4 grid gap-2 text-sm text-slate-300">
                <div className="rounded-xl bg-white/5 px-3 py-2">POST /api/sgg：上传图片，返回 graph 和 graphImageUrl</div>
                <div className="rounded-xl bg-white/5 px-3 py-2">POST /api/sgg-qa：回答类别、数量、位置、关系</div>
                <div className="rounded-xl bg-white/5 px-3 py-2">POST /api/kg-rag：调用 kg_rag 流程回答 JSON 题目</div>
                <div className="rounded-xl bg-white/5 px-3 py-2">POST /api/common-vqa：回答开放式图像常识问题</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[.85fr_1.15fr]">
        <UploadPanel imageUrl={imageUrl} fileName={fileName} onUpload={handleUpload} onRunSgg={runSgg} loading={sggLoading} />
        <SggGraph graph={graph} graphImageUrl={graphImageUrl} loading={sggLoading} />
      </section>

      <RobotQaPanel answers={answers} activeKey={activeKey} onAsk={askSggQuestion} loadingKey={loadingKey} />

      <BottomQa
        jsonQuestion={jsonQuestion}
        setJsonQuestion={setJsonQuestion}
        jsonAnswer={jsonAnswer}
        setJsonAnswer={setJsonAnswer}
        commonQuestion={commonQuestion}
        setCommonQuestion={setCommonQuestion}
        commonAnswer={commonAnswer}
        setCommonAnswer={setCommonAnswer}
        selectedImageName={fileName}
      />

      <footer className="border-t border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500">
        Demo UI for STAR-SGG + KG-RAG. Replace mock responses by wiring the planned API endpoints to your AutoDL backend.
      </footer>
    </main>
  );
}
