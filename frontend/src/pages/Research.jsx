import { useEffect, useState } from "react";
import {
  Search,
  Sparkles,
  FileText,
  Link as LinkIcon,
  CheckSquare,
  Square,
  LoaderCircle,
  AlertCircle,
  Copy,
  Check,
  BookOpen,
  ShieldCheck,
} from "lucide-react";
import { useParams } from "react-router-dom";

import api from "../services/api";
import { generateContent } from "../services/generationService";

function Research() {
  const { projectId } = useParams();

  const [query, setQuery] = useState("");
  const [instructions, setInstructions] = useState("");
  const [selectedSourceIds, setSelectedSourceIds] = useState([]);

  const [sources, setSources] = useState([]);
  const [sourcesLoading, setSourcesLoading] = useState(true);
  const [sourcesError, setSourcesError] = useState("");

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;

    async function fetchSources() {
      try {
        setSourcesLoading(true);
        setSourcesError("");

        const response = await api.get(`/projects/${projectId}/sources`);

        if (active) {
          setSources(Array.isArray(response.data) ? response.data : []);
        }
      } catch (err) {
        if (active) {
          setSourcesError(
            err.response?.data?.detail || "Unable to load project sources.",
          );
        }
      } finally {
        if (active) setSourcesLoading(false);
      }
    }

    if (projectId) fetchSources();

    return () => {
      active = false;
    };
  }, [projectId]);

  const processedSources = sources.filter(
    (source) => source.status === "processed",
  );

  function toggleSource(sourceId) {
    setSelectedSourceIds((current) =>
      current.includes(sourceId)
        ? current.filter((id) => id !== sourceId)
        : [...current, sourceId],
    );
  }

  function toggleAllSources() {
    if (
      processedSources.length > 0 &&
      selectedSourceIds.length === processedSources.length
    ) {
      setSelectedSourceIds([]);
    } else {
      setSelectedSourceIds(processedSources.map((source) => source.id));
    }
  }

  async function handleResearch(event) {
    event.preventDefault();

    if (!query.trim()) {
      setError("Enter a research question or topic first.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setReport(null);
      setCopied(false);

      const result = await generateContent(projectId, {
        type: "summary",
        topic: `Research and investigate the following topic: ${query.trim()}`,
        tone: "informative",
        instructions: [
          "Produce a structured research report.",
          "Use only information supported by the retrieved source context.",
          "Organize the report with a clear title and meaningful sections.",
          "Explain key findings and include supporting evidence where available.",
          "Do not invent facts, statistics, dates, or quotations.",
          "Identify limitations when the sources do not provide enough information.",
          instructions.trim(),
        ]
          .filter(Boolean)
          .join("\n\n"),
        source_ids: selectedSourceIds.length ? selectedSourceIds : null,
      });

      setReport(result);
    } catch (err) {
      console.error("Research failed:", err);

      setError(
        err.response?.data?.detail || "Research failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyReport() {
    if (!report?.content) return;

    try {
      await navigator.clipboard.writeText(report.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Unable to copy the report. Please copy it manually.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <div className="flex items-center gap-2 text-sm text-violet-400">
          <Search size={16} />
          Research Workspace
        </div>

        <h2 className="mt-2 text-2xl font-semibold text-white">
          Research your knowledge
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Investigate questions across your project sources and generate an
          evidence-grounded research report.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        {/* Research form */}
        <form
          onSubmit={handleResearch}
          className="h-fit space-y-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6"
        >
          <div>
            <label
              htmlFor="research-query"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Research question
            </label>

            <textarea
              id="research-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Example: What are the main goals and challenges of the Artemis program?"
              rows={5}
              maxLength={500}
              required
              className="w-full resize-y rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400/60"
            />

            <p className="mt-1 text-right text-xs text-slate-500">
              {query.length}/500
            </p>
          </div>

          {/* Source selector */}
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-medium text-slate-200">
                  Knowledge sources
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Select specific sources or search the entire project.
                </p>
              </div>

              <button
                type="button"
                onClick={toggleAllSources}
                disabled={sourcesLoading || processedSources.length === 0}
                className="shrink-0 text-xs text-violet-400 hover:text-violet-300 disabled:opacity-40"
              >
                {selectedSourceIds.length === processedSources.length &&
                processedSources.length > 0
                  ? "Clear"
                  : "Select all"}
              </button>
            </div>

            <div className="mt-3 rounded-lg bg-violet-500/10 px-3 py-2 text-xs text-violet-300">
              {selectedSourceIds.length
                ? `${selectedSourceIds.length} source(s) selected`
                : "Automatic project-wide retrieval"}
            </div>

            {sourcesLoading ? (
              <div className="flex items-center gap-2 py-5 text-sm text-slate-500">
                <LoaderCircle size={16} className="animate-spin" />
                Loading sources...
              </div>
            ) : sourcesError ? (
              <p className="mt-3 text-sm text-red-300">{sourcesError}</p>
            ) : processedSources.length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-slate-500">
                No processed sources found. Add documents or URLs in the Sources
                tab first.
              </p>
            ) : (
              <div className="mt-3 max-h-60 space-y-2 overflow-y-auto pr-1">
                {processedSources.map((source) => {
                  const selected = selectedSourceIds.includes(source.id);

                  return (
                    <button
                      key={source.id}
                      type="button"
                      onClick={() => toggleSource(source.id)}
                      aria-pressed={selected}
                      className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition ${
                        selected
                          ? "border-violet-400/40 bg-violet-500/10"
                          : "border-white/10 hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className="mt-0.5 text-violet-300">
                        {selected ? (
                          <CheckSquare size={17} />
                        ) : (
                          <Square size={17} />
                        )}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block break-words text-sm text-slate-200">
                          {source.title ||
                            source.filename ||
                            source.url ||
                            "Untitled source"}
                        </span>

                        <span className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          {source.url ? (
                            <LinkIcon size={12} />
                          ) : (
                            <FileText size={12} />
                          )}
                          {(source.type || "document").toUpperCase()}
                          {source.chunk_count > 0 &&
                            ` · ${source.chunk_count} chunks`}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <div>
            <label
              htmlFor="research-instructions"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Additional instructions{" "}
              <span className="font-normal text-slate-500">(optional)</span>
            </label>

            <textarea
              id="research-instructions"
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              placeholder="Focus on comparisons, challenges, evidence, or specific questions..."
              rows={4}
              maxLength={2000}
              className="w-full resize-y rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400/60"
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
            disabled={loading || !query.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <LoaderCircle size={17} className="animate-spin" />
                Researching...
              </>
            ) : (
              <>
                <Sparkles size={17} />
                Start research
              </>
            )}
          </button>

          <p className="text-xs leading-5 text-slate-500">
            Research uses your existing retrieval and generation pipeline.
            Results depend on the relevance of the retrieved source chunks.
          </p>
        </form>

        {/* Report panel */}
        <section className="min-h-[420px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          {!report && !loading && (
            <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10">
                <BookOpen size={25} className="text-violet-300" />
              </div>

              <h3 className="mt-5 text-lg font-medium text-white">
                Your research report will appear here
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Enter a research question and start exploring your project
                knowledge.
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
                Research in progress
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Retrieving sources and preparing your report...
              </p>
            </div>
          )}

          {report && !loading && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5">
                <div>
                  <div className="flex items-center gap-2 text-xs text-violet-400">
                    <Sparkles size={14} />
                    Research report
                  </div>

                  <h3 className="mt-2 font-semibold text-white">
                    {report.topic || query}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={copyReport}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? "Copied" : "Copy report"}
                </button>
              </div>

              <div className="whitespace-pre-wrap break-words p-5 text-sm leading-7 text-slate-300">
                {report.content}
              </div>

              <div className="space-y-4 border-t border-white/10 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <ShieldCheck size={17} className="text-emerald-400" />
                  <span className="text-sm font-medium text-slate-200">
                    Fact-check status
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300">
                    {report.fact_check_result || "Not provided"}
                  </span>
                </div>

                <div>
                  <h4 className="mb-3 text-sm font-medium text-slate-200">
                    Sources ({report.sources?.length || 0})
                  </h4>

                  {report.sources?.length ? (
                    <div className="space-y-3">
                      {report.sources.map((source, index) => (
                        <article
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
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      No source references were returned.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default Research;
