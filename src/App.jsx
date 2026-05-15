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
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import InteractiveSggGraph from "./InteractiveSggGraph";
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
    title: "The category problem of scene diagrams",
    prompt: "Which categories of scene graph objects are included in the image",
    desc: "Which SGG object categories are included in the image?",
    icon: Tags,
  },
  {
    key: "count",
    title: "The count problem of scene diagrams",
    prompt: "How many objects of each category are in the image?",
    desc: "How many objects of each category are in the image?",
    icon: Hash,
  },
  {
    key: "location",
    title: "The location problem of scene diagrams",
    prompt: "Where are the objects located in the image?",
    desc: "Where are the objects located in the image?",
    icon: MapPin,
  },
  {
    key: "relationship",
    title: "The relationship problem of scene diagrams",
    prompt: "What are the relationships between the objects in the image?",
    desc: "What are the relationships between the objects in the image?",
    icon: GitBranch,
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
          <h2 className="mt-1 text-2xl font-black text-slate-950">Task 1: Scene diagram generation</h2>
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
            <p className="mt-5 text-lg font-black text-slate-900">Click to upload satellite image</p>
            <p className="mt-2 text-sm text-slate-500">Supports PNG / JPG / JPEG. After uploading, you can request the backend to generate SGG detection and structure diagrams.</p>
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
          Generate SGG Structure Diagram
        </button>
        <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Scene Diagram Generation
        </div>
      </div>
    </div>
  );
}

function ZoomViewerModal({ open, onClose, src, title }) {
  if (!open || !src) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="absolute inset-4 flex flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-xl font-black text-slate-950">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white"
          >
            Close
          </button>
        </div>

        <div className="relative flex-1 overflow-hidden bg-slate-100">
          <TransformWrapper
            initialScale={1}
            minScale={0.2}
            maxScale={30}
            wheel={{ step: 0.12 }}
            doubleClick={{ disabled: false }}
            panning={{ disabled: false }}
            centerOnInit
            limitToBounds={false}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                <div className="absolute right-6 top-6 z-10 flex gap-2">
                  <button
                    type="button"
                    onClick={() => zoomIn()}
                    className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white"
                  >
                    Zoom In +
                  </button>
                  <button
                    type="button"
                    onClick={() => zoomOut()}
                    className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white"
                  >
                    Zoom Out -
                  </button>
                  <button
                    type="button"
                    onClick={() => resetTransform()}
                    className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white"
                  >
                    Reset
                  </button>
                </div>

                <TransformComponent
                  wrapperClass="!w-full !h-full"
                  contentClass="!w-full !h-full flex items-center justify-center"
                >
                  <img
                    src={src}
                    alt={title}
                    className="max-h-[80vh] max-w-[90vw] select-none object-contain"
                    draggable={false}
                  />
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        </div>
      </div>
    </div>
  );
}

function SggGraph({ graph, graphImageUrl, annotatedImageUrl, loading, rawRelationCount, displayRelationCount }) {
  const [zoomData, setZoomData] = useState(null);
  const [graphModalOpen, setGraphModalOpen] = useState(false);

  const hasInteractiveGraph = graph?.relations?.length > 0;

  return (
    <>
      <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
              SGG Output
            </p>
            <h2 className="mt-1 text-2xl font-black">Image Annotation + Structure Diagram</h2>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* 右侧左框：标框图 */}
          <div className="relative min-h-[315px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-white p-3 text-slate-950">
            {annotatedImageUrl ? (
              <button
                type="button"
                onClick={() =>
                  setZoomData({
                    src: annotatedImageUrl,
                    title: "Image Annotation Result",
                  })
                }
                className="h-full w-full cursor-zoom-in"
              >
                <img
                  src={annotatedImageUrl}
                  alt="SGG annotated detection result"
                  className="h-[315px] w-full object-contain"
                />
              </button>
            ) : (
              <div className="flex h-[315px] w-full items-center justify-center text-slate-400">
                No annotation results available
              </div>
            )}

            <div className="absolute bottom-4 left-4 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2 text-sm text-slate-200 backdrop-blur">
              {loading ? "Generating detection result..." : "Click to zoom in / drag to pan"}
            </div>
          </div>

          {/* 右侧右框：结构图 */}
          <div className="relative min-h-[315px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-white p-3 text-slate-950">
            {hasInteractiveGraph ? (
              <>
                <div className="h-[315px] w-full">
                  <InteractiveSggGraph graph={graph} />
                </div>

                <button
                  type="button"
                  onClick={() => setGraphModalOpen(true)}
                  className="absolute right-4 top-4 rounded-full bg-slate-950/80 px-4 py-2 text-sm font-bold text-white shadow-lg backdrop-blur"
                >
                  Zoom In
                </button>
              </>
            ) : graphImageUrl ? (
              <button
                type="button"
                onClick={() =>
                  setZoomData({
                    src: graphImageUrl,
                    title: "SGG Structure Diagram",
                  })
                }
                className="h-full w-full cursor-zoom-in"
              >
                <img
                  src={graphImageUrl}
                  alt="SGG scene graph"
                  className="h-[315px] w-full object-contain"
                />
              </button>
            ) : (
              <div className="flex h-[315px] w-full items-center justify-center text-slate-400">
                No structure diagram results available
              </div>
            )}

            <div className="absolute bottom-4 left-4 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2 text-sm text-slate-200 backdrop-blur">
              {hasInteractiveGraph
                ? "Drag nodes / blue control points to adjust the structure diagram"
                : "Click to zoom in / drag to pan"}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-400">Objects</p>
            <p className="mt-1 text-2xl font-black">{graph?.objects?.length || 0}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-400">Unique Relations</p>
            <p className="mt-1 text-2xl font-black">
              {displayRelationCount || graph?.relations?.length || 0}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Raw: {rawRelationCount || graph?.relations?.length || 0}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-400">Mode</p>
            <p className="mt-1 text-lg font-black">STAR-SGG Demo</p>
          </div>
        </div>
      </div>

      <ZoomViewerModal
        open={!!zoomData}
        onClose={() => setZoomData(null)}
        src={zoomData?.src}
        title={zoomData?.title}
      />

      {graphModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setGraphModalOpen(false)}
        >
          <div
            className="flex h-full flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-xl font-black text-slate-950">SGG Interactive Structure Diagram</h3>

              <button
                type="button"
                onClick={() => setGraphModalOpen(false)}
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white"
              >
                Close
              </button>
            </div>

            <div className="relative min-h-0 flex-1 bg-white">
              <TransformWrapper
                initialScale={1}
                minScale={0.35}
                maxScale={8}
                wheel={{ step: 0.12 }}
                doubleClick={{ disabled: false }}
                panning={{ disabled: false }}
                centerOnInit
                limitToBounds={false}
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    <div className="absolute right-6 top-6 z-20 flex gap-2">
                      <button
                        type="button"
                        onClick={() => zoomIn()}
                        className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-lg"
                      >
                        Zoom In +
                      </button>

                      <button
                        type="button"
                        onClick={() => zoomOut()}
                        className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-lg"
                      >
                        Zoom Out -
                      </button>

                      <button
                        type="button"
                        onClick={() => resetTransform()}
                        className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-lg"
                      >
                        Reset
                      </button>
                    </div>

                    <div className="absolute left-6 top-6 z-20 rounded-full bg-slate-950/80 px-4 py-2 text-sm font-bold text-white shadow-lg">
                      Wheel Zoom / Drag Canvas / Drag Nodes and Blue Control Points
                    </div>

                    <TransformComponent
                      wrapperClass="!h-full !w-full"
                      contentClass="!h-full !w-full"
                    >
                      <div className="h-[85vh] w-[1400px] p-6">
                        <InteractiveSggGraph graph={graph} />
                      </div>
                    </TransformComponent>
                  </>
                )}
              </TransformWrapper>
            </div>
          </div>
        </div>
      )}
    </>
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
              <h2 className="text-3xl font-black text-slate-950">Task 2: Scene Diagram Q&A</h2>
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
                <p className="text-sm text-slate-400">Robot Answer</p>
                <h3 className="text-xl font-black">{activeQuestion.title}</h3>
              </div>
            </div>
            <Sparkles className="h-6 w-6 text-cyan-300" />
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-bold text-cyan-200">Question</p>
            <p className="mt-2 leading-7 text-slate-100">{activeQuestion.prompt}</p>
          </div>

          <div className="mt-4 min-h-[190px] rounded-[1.5rem] border border-white/10 bg-white p-5 text-slate-900">
            <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-500">
              {loadingKey === activeQuestion.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              Answer
            </div>
            <pre className="whitespace-pre-wrap font-sans leading-8">{loadingKey === activeQuestion.key ? "Generating answer..." : answers[activeQuestion.key] || "Please click on a question to get an answer."}</pre>
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

      if (data.question) {
        setJsonQuestion(data.question);
      }

      setJsonAnswer(
        `LLM output：${data.llm_answer_raw || ""}\nStandard answer：${data.ground_truth || ""}\nIs correct：${data.is_correct ?? ""}`
      );
    } catch (err) {
      console.error("KG-RAG request failed:", err);
      setJsonAnswer(`KG-RAG request failed. Please check the backend at /api/kg-rag.\n\nError message: ${err.message}`);
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
      setCommonAnswer("Demo mode answer: Aircraft, runway, taxiway, and jet bridge visible in the image. In real deployment, this should call a vision large model or image understanding API.");
    } finally {
      setCommonLoading(false);
    }
  };

  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-12 pt-4 lg:grid-cols-2">
      <QuestionCard title="Task 3: Knowledge Graph Q&A" icon={FileJson} accent="bg-gradient-to-br from-violet-500 to-fuchsia-500">
        <p className="mb-3 text-sm leading-6 text-slate-600">Enhance LLM reasoning capabilities using a knowledge graph</p>
        <textarea
          value={jsonQuestion}
          onChange={(e) => setJsonQuestion(e.target.value)}
          className="min-h-[155px] w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 outline-none focus:border-violet-400"
        />
        <div className="mt-4 flex items-center gap-3">
          <button onClick={askJson} disabled={jsonLoading} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white disabled:opacity-50">
            {jsonLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Get Question
          </button>
          <span className="text-sm text-slate-500">KGQA</span>
        </div>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-2 text-sm font-black text-slate-500">Output Answer</p>
          <pre className="whitespace-pre-wrap text-sm leading-7 text-slate-800">{jsonAnswer || "Waiting for kg_rag output..."}</pre>
        </div>
      </QuestionCard>

      <QuestionCard title="Task 4: Common Sense Q&A" icon={Brain} accent="bg-gradient-to-br from-emerald-500 to-teal-500">
        <p className="mb-3 text-sm leading-6 text-slate-600">Here is used to ask open-ended common sense questions, such as "What is in the image?", or "What scene is in the image?"</p>
        <textarea
          value={commonQuestion}
          onChange={(e) => setCommonQuestion(e.target.value)}
          className="min-h-[155px] w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 outline-none focus:border-emerald-400"
        />
        <div className="mt-4 flex items-center gap-3">
          <button onClick={askCommon} disabled={commonLoading} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white disabled:opacity-50">
            {commonLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            Ask Common Sense Question
          </button>
          <span className="text-sm text-slate-500">Connected to LLM</span>
        </div>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-2 text-sm font-black text-slate-500">Output Answer</p>
          <pre className="whitespace-pre-wrap text-sm leading-7 text-slate-800">{commonAnswer || "Waiting for visual question answering output..."}</pre>
        </div>
      </QuestionCard>
    </section>
  );
}

const loadRealJsonQuestionByImage = async (imageName) => {
  if (!imageName) return;

  setJsonQuestion("The real problem is being read based on the picture...");
  setJsonAnswer("The real problem is being read based on the picture...");

  try {
    const data = await postJson("/api/kg-rag", {
      image: imageName,
    });

    console.log("Auto KG-RAG question response:", data);

    if (data.status && data.status !== "ok") {
      setJsonQuestion("The real problem was not found.");
      setJsonAnswer(data.answer || "The real problem was not found.");
      return;
    }

    // 关键：把后端返回的真实问题放进上面的 textarea
    setJsonQuestion(data.question || "");

    // 下面只显示答案
    setJsonAnswer(
      `LLM 输出：${data.llm_answer_raw || ""}\n标准答案：${data.ground_truth || ""}\n是否正确：${data.is_correct ?? ""}`
    );
  } catch (err) {
    console.error("Auto load KG-RAG question failed:", err);
    setJsonQuestion("The real problem failed to load.");
    setJsonAnswer(`Failed to automatically load the real question. Please check the backend /api/kg-rag.\n\nError message: ${err.message}`);
  }
};

export default function App() {
  const [imageUrl, setImageUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [graph, setGraph] = useState(sampleGraph);
  const [graphImageUrl, setGraphImageUrl] = useState("");
  const [annotatedImageUrl, setAnnotatedImageUrl] = useState("");
  const [rawRelationCount, setRawRelationCount] = useState(0);
  const [displayRelationCount, setDisplayRelationCount] = useState(0);
  const [sggLoading, setSggLoading] = useState(false);
  const [activeKey, setActiveKey] = useState("category");
  const [answers, setAnswers] = useState({});
  const [loadingKey, setLoadingKey] = useState("");
  const [jsonQuestion, setJsonQuestion] = useState(defaultJsonQuestion);
  const [jsonAnswer, setJsonAnswer] = useState("");
  const [commonQuestion, setCommonQuestion] = useState("What is in the image?");
  const [commonAnswer, setCommonAnswer] = useState("");

  const handleUpload = (file) => {
    setFileName(file.name);
    setImageUrl(URL.createObjectURL(file));
    setGraph(sampleGraph);
    setGraphImageUrl("");
    setAnnotatedImageUrl("");
    setRawRelationCount(0);
    setDisplayRelationCount(0);
    setAnswers({});
    setCommonAnswer("");

    setJsonQuestion("The real problem is being read based on the picture...");
    setJsonAnswer("The real problem is being read based on the picture...");

    loadRealJsonQuestionByImage(file.name);
  };

  const runSgg = async () => {
    setSggLoading(true);
    try {
      const input = document.querySelector('input[type="file"]');
      const file = input?.files?.[0];
      const formData = new FormData();
      if (file) formData.append("image", file);
      const data = await postForm("/api/sgg", formData);
      setRawRelationCount(data.rawRelationCount || 0);
      setDisplayRelationCount(data.displayRelationCount || data.graph?.relations?.length || 0);
      console.log("SGG response:", data);
      if (data.graph) {
          setGraph(data.graph);
        }

      if (data.annotatedImageUrl) {
        const fullAnnotatedUrl = data.annotatedImageUrl.startsWith("http")
          ? data.annotatedImageUrl
          : `${API_BASE}${data.annotatedImageUrl}`;

        setAnnotatedImageUrl(`${fullAnnotatedUrl}?t=${Date.now()}`);
      }

      if (data.graphImageUrl) {
        const fullGraphUrl = data.graphImageUrl.startsWith("http")
          ? data.graphImageUrl
          : `${API_BASE}${data.graphImageUrl}`;

        setGraphImageUrl(`${fullGraphUrl}?t=${Date.now()}`);
      }
    } catch (err) {
      console.error("SGG request failed:", err);
      alert(`SGG generation failed: ${err.message}`);
      setGraph(sampleGraph);
      setGraphImageUrl("");
      setAnnotatedImageUrl("");
      setRawRelationCount(0);
      setDisplayRelationCount(0);
      } finally {
      setSggLoading(false);
    }
  };

  const askSggQuestion = async (question) => {
    setActiveKey(question.key);

    if (!fileName) {
      setAnswers((prev) => ({
        ...prev,
        [question.key]: "Please upload an image first, then select an SGG question.",
      }));
      return;
    }

    setLoadingKey(question.key);

    try {
      const data = await postJson("/api/sgg-qa", {
        type: question.key,
        question: question.prompt,
        image: fileName,
      });

      console.log("SGG QA response:", data);

      if (data.status && data.status !== "ok") {
        setAnswers((prev) => ({
          ...prev,
          [question.key]: data.answer || `SGG question answering failed: ${data.status}`,
        }));
        return;
      }

      setAnswers((prev) => ({
        ...prev,
        [question.key]: data.answer || "The backend did not return an answer field.",
      }));
    } catch (err) {
      console.error("SGG QA request failed:", err);

      setAnswers((prev) => ({
        ...prev,
        [question.key]: `SGG question answering request failed. Please check the backend /api/sgg-qa.\n\nError message: ${err.message}`,
      }));
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
                SGG Image Parsing and <span className="bg-gradient-to-r from-cyan-300 via-emerald-300 to-amber-200 bg-clip-text text-transparent">KG-RAG Question Answering</span>
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
                Upload remote sensing images, display detection results and Scene Graph, then perform robot question answering around four types of questions: categories, quantities, positions, and relationships. The bottom supports JSON questions to go through the kg_rag process and also supports common-sense image question answering.
              </p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="font-black text-cyan-200">Task Overview</p>
              <div className="mt-4 grid gap-2 text-sm text-slate-300">
                <div className="rounded-xl bg-white/5 px-3 py-2">Task 1: Scene Graph Generation</div>
                <div className="rounded-xl bg-white/5 px-3 py-2">Task 2: Scene Graph Question Answering</div>
                <div className="rounded-xl bg-white/5 px-3 py-2">Task 3: Knowledge Graph Question Answering</div>
                <div className="rounded-xl bg-white/5 px-3 py-2">Task 4: Common Sense Question Answering</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[.85fr_1.15fr]">
        <UploadPanel imageUrl={imageUrl} fileName={fileName} onUpload={handleUpload} onRunSgg={runSgg} loading={sggLoading} />
        <SggGraph graph={graph} graphImageUrl={graphImageUrl} annotatedImageUrl={annotatedImageUrl} loading={sggLoading} rawRelationCount={rawRelationCount} displayRelationCount={displayRelationCount} />
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
        Scene diagram generation demonstration demo.
        Contact: <a href="mailto:dxyufei@lnut.edu.cn" className="text-cyan-500 hover:underline">
          dxyufei@lnut.edu.cn
        </a>
      </footer>
    </main>
  );
}
