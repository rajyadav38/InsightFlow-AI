import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Sparkles,
  FileText,
  Copy,
  Check,
  LoaderCircle,
  AlertCircle,
  BookOpen,
  BriefcaseBusiness,
  MessageSquare,
  Newspaper,
  ShieldCheck,
} from "lucide-react";
import { generateContent } from "../services/generationService";

const contentTypes = [
  { value: "blog", label: "Blog Post", icon: BookOpen },
  { value: "linkedin_post", label: "LinkedIn Post", icon: BriefcaseBusiness },
  { value: "tweet", label: "Tweet", icon: MessageSquare },
  { value: "newsletter", label: "Newsletter", icon: Newspaper },
  { value: "summary", label: "Summary", icon: FileText },
];

const tones = [
  "professional",
  "conversational",
  "informative",
  "academic",
  "persuasive",
  "creative",
];

function Generate() {
  const { projectId } = useParams();

  const [type, setType] = useState("blog");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("professional");
  const [instructions, setInstructions] = useState("");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (event) => {
    event.preventDefault();

    if (!topic.trim()) {
      setError("Please enter a topic to generate content.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const data = await generateContent(projectId, {
        type,
        topic: topic.trim(),
        tone,
        instructions: instructions.trim() || null,
      });

      setResult(data);
    } catch (err) {
      console.error("Content generation failed:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to generate content. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.content) return;

    try {
      await navigator.clipboard.writeText(result.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Unable to copy content. Please copy it manually.");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-violet-400">
          <Sparkles size={16} />
          AI Content Studio
        </div>

        <h2 className="mt-2 text-2xl font-semibold text-white">
          Generate content
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Turn your project sources into useful content with AI. Your generated
          content can include source references and fact-checking information.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        {/* Generation Form */}
        <form
          onSubmit={handleGenerate}
          className="h-fit space-y-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6"
        >
          <div>
            <label className="mb-3 block text-sm font-medium text-slate-200">
              Content type
            </label>

            <div className="grid grid-cols-2 gap-3">
              {contentTypes.map((item) => {
                const Icon = item.icon;
                const selected = type === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setType(item.value)}
                    className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm transition ${
                      selected
                        ? "border-violet-400/50 bg-violet-500/10 text-violet-300"
                        : "border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <Icon size={17} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="generation-topic"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Topic
            </label>

            <textarea
              id="generation-topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="What should the AI write about?"
              maxLength={500}
              rows={3}
              required
              className="w-full resize-y rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/60"
            />

            <p className="mt-1 text-right text-xs text-slate-500">
              {topic.length}/500
            </p>
          </div>

          <div>
            <label
              htmlFor="generation-tone"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Writing tone
            </label>

            <select
              id="generation-tone"
              value={tone}
              onChange={(event) => setTone(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-violet-400/60"
            >
              {tones.map((item) => (
                <option key={item} value={item}>
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="generation-instructions"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Additional instructions{" "}
              <span className="font-normal text-slate-500">(optional)</span>
            </label>

            <textarea
              id="generation-instructions"
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              placeholder="Specify length, audience, structure, or other requirements..."
              maxLength={2000}
              rows={4}
              className="w-full resize-y rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/60"
            />
          </div>

          {error && (
            <div className="flex gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <LoaderCircle size={17} className="animate-spin" />
                Generating content...
              </>
            ) : (
              <>
                <Sparkles size={17} />
                Generate content
              </>
            )}
          </button>

          <p className="text-xs leading-5 text-slate-500">
            Generation uses your project sources. If the backend cannot find
            relevant source information, it may reject the request.
          </p>
        </form>

        {/* Output Panel */}
        <div className="min-h-[420px] rounded-2xl border border-white/10 bg-white/[0.02]">
          {!result && !loading && (
            <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10">
                <Sparkles size={25} className="text-violet-300" />
              </div>

              <h3 className="mt-5 text-lg font-medium text-white">
                Your content will appear here
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Choose a format, describe your topic, and generate content
                grounded in your project sources.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
              <LoaderCircle
                size={34}
                className="animate-spin text-violet-400"
              />
              <h3 className="mt-5 font-medium text-white">
                Creating your content
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Researching sources and preparing your output...
              </p>
            </div>
          )}

          {result && !loading && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5">
                <div>
                  <h3 className="font-semibold text-white">Generated output</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {result.topic || topic}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              <div className="whitespace-pre-wrap break-words p-5 text-sm leading-7 text-slate-300">
                {result.content}
              </div>

              <div className="space-y-4 border-t border-white/10 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <ShieldCheck size={17} className="text-emerald-400" />
                  <span className="text-sm font-medium text-slate-200">
                    Fact-check status
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300">
                    {result.fact_check_result || "Not provided"}
                  </span>
                </div>

                {typeof result.revision_count === "number" && (
                  <p className="text-xs text-slate-500">
                    Revision count: {result.revision_count}
                  </p>
                )}

                <div>
                  <h4 className="mb-3 text-sm font-medium text-slate-200">
                    Sources ({result.sources?.length || 0})
                  </h4>

                  {result.sources?.length ? (
                    <div className="space-y-3">
                      {result.sources.map((source, index) => (
                        <div
                          key={`${source.source_id || "source"}-${source.chunk_index ?? index}`}
                          className="rounded-xl border border-white/10 bg-white/[0.02] p-3"
                        >
                          <div className="flex items-start gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-xs font-medium text-violet-300">
                              {source.citation_index ?? index + 1}
                            </span>

                            <div className="min-w-0 flex-1">
                              <p className="break-words text-sm font-medium text-slate-200">
                                {source.title ||
                                  source.filename ||
                                  source.url ||
                                  "Untitled source"}
                              </p>

                              {source.excerpt && (
                                <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-500">
                                  {source.excerpt}
                                </p>
                              )}

                              {source.url && (
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-2 inline-block break-all text-xs text-violet-400 hover:text-violet-300"
                                >
                                  Open source
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      No source references were returned.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Generate;
