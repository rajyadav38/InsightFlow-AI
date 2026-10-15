import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Search,
  FileText,
  MessageSquare,
  Newspaper,
  BriefcaseBusiness,
  Copy,
  Trash2,
  Clock3,
  ShieldCheck,
  LoaderCircle,
  AlertCircle,
  X,
  Sparkles,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { useParams } from "react-router-dom";
import api from "../services/api";

const contentTypes = [
  { value: "blog", label: "Blog Post", icon: BookOpen },
  { value: "linkedin_post", label: "LinkedIn Post", icon: BriefcaseBusiness },
  { value: "linkedin", label: "LinkedIn Post", icon: BriefcaseBusiness },
  { value: "tweet", label: "Tweet", icon: MessageSquare },
  { value: "newsletter", label: "Newsletter", icon: Newspaper },
  { value: "summary", label: "Summary / Research", icon: FileText },
];

function getType(type) {
  return (
    contentTypes.find((item) => item.value === type) || {
      value: type,
      label: type || "Generated content",
      icon: FileText,
    }
  );
}

function formatDate(date) {
  if (!date) return "Date unavailable";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Date unavailable";

  return parsed.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Library() {
  const { projectId } = useParams();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchItems = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        setError("");

        const response = await api.get(`/projects/${projectId}/generated`);

        setItems(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error("Failed to load Library:", err);
        setError(err.response?.data?.detail || "Unable to load saved content.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [projectId],
  );

  useEffect(() => {
    if (projectId) fetchItems();
  }, [projectId, fetchItems]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesType = typeFilter === "all" || item.type === typeFilter;

      const matchesSearch =
        !term ||
        (item.topic || "").toLowerCase().includes(term) ||
        (item.content || "").toLowerCase().includes(term) ||
        getType(item.type).label.toLowerCase().includes(term);

      return matchesType && matchesSearch;
    });
  }, [items, search, typeFilter]);

  async function openItem(item) {
    setSelectedItem(item);
    setActionError("");
    setCopied(false);
    setDetailLoading(true);

    try {
      const response = await api.get(
        `/projects/${projectId}/generated/${item.id}`,
      );
      setSelectedItem(response.data);
    } catch (err) {
      console.error("Failed to load saved content:", err);
      setActionError(
        err.response?.data?.detail ||
          "Unable to load the complete saved content.",
      );
    } finally {
      setDetailLoading(false);
    }
  }

  async function copyContent(content) {
    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setActionError("");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setActionError("Copy failed. Check browser clipboard permissions.");
    }
  }

  async function deleteItem(item) {
    const confirmed = window.confirm(
      `Delete "${item.topic || "this saved item"}"? This cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setDeletingId(item.id);
      setActionError("");

      await api.delete(`/projects/${projectId}/generated/${item.id}`);

      setItems((current) => current.filter((entry) => entry.id !== item.id));

      if (selectedItem?.id === item.id) {
        setSelectedItem(null);
      }
    } catch (err) {
      console.error("Failed to delete saved content:", err);
      setActionError(
        err.response?.data?.detail || "Unable to delete this item.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const typeOptions = [
    ...new Map(
      items.map((item) => [
        item.type,
        { value: item.type, label: getType(item.type).label },
      ]),
    ).values(),
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-violet-400">
            <Sparkles size={16} />
            Knowledge Library
          </div>

          <h2 className="mt-2 text-2xl font-semibold text-white">
            Your saved content
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Browse, revisit, copy, and manage content generated in this project.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchItems(true)}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </header>

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard icon={FileText} label="Saved items" value={items.length} />
        <SummaryCard
          icon={ShieldCheck}
          label="Fact-check passed"
          value={
            items.filter((item) => item.fact_check_result === "PASS").length
          }
        />
        <SummaryCard
          icon={Clock3}
          label="Latest saved"
          value={items.length ? formatDate(items[0].created_at) : "—"}
          compact
        />
      </div>

      {/* Search and filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 md:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search saved content..."
            className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400/50"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-300 outline-none focus:border-violet-400/50"
        >
          <option value="all">All content types</option>
          {typeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => fetchItems()}
            className="ml-auto underline"
          >
            Retry
          </button>
        </div>
      )}

      {actionError && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError("")}
            className="ml-auto"
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Content list */}
      {loading ? (
        <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-400">
          <LoaderCircle size={20} className="animate-spin text-violet-400" />
          Loading your Library...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10">
            <BookOpen size={25} className="text-violet-300" />
          </div>

          <h3 className="mt-5 text-lg font-medium text-white">
            {items.length === 0
              ? "Your Library is empty"
              : "No matching content"}
          </h3>

          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            {items.length === 0
              ? "Generate content in the Generate or Research tab. Saved outputs will appear here automatically."
              : "Try another search term or change the content type filter."}
          </p>

          {(search || typeFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setTypeFilter("all");
              }}
              className="mt-4 text-sm text-violet-400 hover:text-violet-300"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => {
            const type = getType(item.type);
            const Icon = type.icon;

            return (
              <article
                key={item.id}
                className="flex min-w-0 flex-col rounded-2xl border border-white/10 bg-white/[0.02] transition hover:border-violet-400/30 hover:bg-white/[0.035]"
              >
                <button
                  type="button"
                  onClick={() => openItem(item)}
                  className="flex-1 p-5 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                      <Icon size={19} />
                    </div>

                    <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-400">
                      {type.label}
                    </span>
                  </div>

                  <h3 className="mt-4 line-clamp-2 break-words font-semibold text-white">
                    {item.topic || "Untitled content"}
                  </h3>

                  <p className="mt-3 line-clamp-5 whitespace-pre-wrap break-words text-sm leading-6 text-slate-400">
                    {item.content}
                  </p>
                </button>

                <div className="mt-auto border-t border-white/10 px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
                      <Clock3 size={13} />
                      <span className="truncate">
                        {formatDate(item.created_at)}
                      </span>
                    </span>

                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-xs ${
                        item.fact_check_result === "PASS"
                          ? "bg-emerald-500/10 text-emerald-300"
                          : item.fact_check_result === "FAIL"
                            ? "bg-red-500/10 text-red-300"
                            : "bg-white/5 text-slate-400"
                      }`}
                    >
                      {item.fact_check_result || "Not checked"}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => openItem(item)}
                      className="text-sm text-violet-400 hover:text-violet-300"
                    >
                      Open content
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteItem(item)}
                      disabled={deletingId === item.id}
                      aria-label="Delete saved content"
                      title="Delete"
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                    >
                      {deletingId === item.id ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Content detail modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedItem(null);
              setActionError("");
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="library-detail-title"
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5 md:p-6">
              <div className="min-w-0">
                <p className="text-xs text-violet-400">
                  {getType(selectedItem.type).label}
                </p>

                <h3
                  id="library-detail-title"
                  className="mt-2 break-words text-lg font-semibold text-white"
                >
                  {selectedItem.topic || "Saved content"}
                </h3>

                <p className="mt-2 text-xs text-slate-500">
                  Saved {formatDate(selectedItem.created_at)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyContent(selectedItem.content)}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
                >
                  <Copy size={15} />
                  <span className="hidden sm:inline">
                    {copied ? "Copied" : "Copy"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedItem(null);
                    setActionError("");
                  }}
                  className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
                  aria-label="Close content details"
                >
                  <X size={19} />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5 md:p-6">
              {detailLoading ? (
                <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-400">
                  <LoaderCircle size={20} className="animate-spin" />
                  Loading complete content...
                </div>
              ) : (
                <>
                  <div className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">
                    {selectedItem.content}
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
                    <span className="text-sm text-slate-400">
                      Fact-check status
                    </span>

                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                      {selectedItem.fact_check_result || "Not checked"}
                    </span>

                    <span className="text-xs text-slate-500">
                      Revisions: {selectedItem.revision_count ?? 0}
                    </span>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-medium text-white">
                      Sources ({selectedItem.sources?.length || 0})
                    </h4>

                    {selectedItem.sources?.length ? (
                      <div className="mt-3 space-y-3">
                        {selectedItem.sources.map((source, index) => (
                          <article
                            key={`${source.source_id || "source"}-${source.chunk_index ?? index}`}
                            className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                          >
                            <div className="flex items-start gap-3">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-xs text-violet-300">
                                {source.citation_index ?? index + 1}
                              </span>

                              <div className="min-w-0 flex-1">
                                <p className="break-words text-sm font-medium text-slate-200">
                                  {source.title ||
                                    source.filename ||
                                    source.url ||
                                    "Source"}
                                </p>

                                {source.excerpt && (
                                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-400">
                                    {source.excerpt}
                                  </p>
                                )}

                                {source.url && (
                                  <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-3 inline-flex items-center gap-1.5 break-all text-xs text-violet-400 hover:text-violet-300"
                                  >
                                    Open source
                                    <ExternalLink size={12} />
                                  </a>
                                )}
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-slate-500">
                        No source references were saved for this item.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end border-t border-white/10 p-4">
              <button
                type="button"
                onClick={() => deleteItem(selectedItem)}
                disabled={deletingId === selectedItem.id}
                className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
              >
                <Trash2 size={15} />
                Delete saved content
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, compact = false }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Icon size={16} className="text-violet-300" />
        {label}
      </div>

      <p
        className={`mt-3 break-words font-semibold text-white ${
          compact ? "text-sm" : "text-2xl"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default Library;
