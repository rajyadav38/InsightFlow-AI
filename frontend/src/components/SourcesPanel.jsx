import { useEffect, useRef, useState } from "react";
import {
  FileText,
  Link as LinkIcon,
  Upload,
  Trash2,
  X,
  LoaderCircle,
  CheckCircle2,
  Clock3,
  AlertCircle,
} from "lucide-react";

import api from "../services/api";

const FILE_TYPES = {
  pdf: {
    label: "PDF",
    accept: ".pdf",
  },
  docx: {
    label: "DOCX",
    accept: ".docx",
  },
  txt: {
    label: "TXT",
    accept: ".txt",
  },
};

function SourcesPanel({ projectId }) {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);

  const [url, setUrl] = useState("");
  const [urlType, setUrlType] = useState("article");

  const [uploading, setUploading] = useState(false);
  const [addingUrl, setAddingUrl] = useState(false);

  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  // --------------------------------
  // Fetch sources
  // --------------------------------

  const fetchSources = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/projects/${projectId}/sources`);

      setSources(response.data);
    } catch (error) {
      console.error("Failed to fetch sources:", error);

      setError(error.response?.data?.detail || "Unable to load sources.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, [projectId]);

  // --------------------------------
  // Upload file
  // --------------------------------

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!FILE_TYPES[extension]) {
      setError("Only PDF, DOCX, and TXT files are supported.");

      event.target.value = "";
      return;
    }

    const formData = new FormData();

    formData.append("type", extension);
    formData.append("title", file.name);
    formData.append("file", file);

    try {
      setUploading(true);
      setError("");
      setShowAddMenu(false);

      const uploadResponse = await api.post(
        `/projects/${projectId}/sources`,
        formData,
      );

      const uploadedSource = uploadResponse.data;

      if (uploadedSource?.id) {
        setUploading(true);

        await api.post(
          `/projects/${projectId}/sources/${uploadedSource.id}/process`,
        );
      }

      await fetchSources();
    } catch (error) {
      console.error("UPLOAD ERROR:", error.response?.data);

      const detail = error.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(
          detail
            .map((item) => `${item.loc?.join(" → ")}: ${item.msg}`)
            .join(" | "),
        );
      } else if (typeof detail === "string") {
        setError(detail);
      } else {
        setError("Unable to upload the source.");
      }
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  // --------------------------------
  // Add URL
  // --------------------------------

  const handleAddUrl = async (event) => {
    event.preventDefault();

    if (!url.trim()) {
      return;
    }

    const formData = new FormData();

    formData.append("type", urlType);
    formData.append("title", url.trim());
    formData.append("url", url.trim());

    try {
      setAddingUrl(true);
      setError("");

      await api.post(`/projects/${projectId}/sources`, formData);

      setUrl("");
      setUrlType("article");
      setShowUrlModal(false);
      setShowAddMenu(false);

      await fetchSources();
    } catch (error) {
      console.error("URL ERROR:", error.response?.data);

      const detail = error.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(
          detail
            .map((item) => `${item.loc?.join(" → ")}: ${item.msg}`)
            .join(" | "),
        );
      } else if (typeof detail === "string") {
        setError(detail);
      } else {
        setError("Unable to add this URL.");
      }
    } finally {
      setAddingUrl(false);
    }
  };

  // --------------------------------
  // Delete source
  // --------------------------------

  const handleDelete = async (sourceId) => {
    const confirmed = window.confirm("Delete this source?");

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(`/projects/${projectId}/sources/${sourceId}`);

      setSources((current) =>
        current.filter((source) => source.id !== sourceId),
      );
    } catch (error) {
      console.error("Failed to delete source:", error);

      setError(error.response?.data?.detail || "Unable to delete source.");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Sources</h2>

          <p className="mt-1 text-sm text-slate-500">
            Add knowledge sources to this project.
          </p>
        </div>

        {/* Add Source */}
        <div className="relative">
          <button
            onClick={() => setShowAddMenu((current) => !current)}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-slate-200"
          >
            <Upload size={16} />
            Add Source
          </button>

          {showAddMenu && (
            <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-white/10 bg-slate-900 p-1 shadow-2xl">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-300 hover:bg-white/5 hover:text-white"
              >
                <FileText size={17} />
                Upload document
              </button>

              <button
                onClick={() => {
                  setShowUrlModal(true);
                  setShowAddMenu(false);
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-300 hover:bg-white/5 hover:text-white"
              >
                <LinkIcon size={17} />
                Add URL
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle size={17} className="mt-0.5 shrink-0" />

          <span>{error}</span>
        </div>
      )}

      {/* Uploading */}
      {uploading && (
        <div className="mb-5 flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
          <LoaderCircle size={17} className="animate-spin" />
          Uploading and processing your document...
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex min-h-[250px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <LoaderCircle size={17} className="animate-spin" />
            Loading sources...
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && sources.length === 0 && (
        <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
          <div className="max-w-md px-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
              <FileText size={22} className="text-slate-500" />
            </div>

            <h3 className="mt-4 font-semibold">No sources yet</h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Upload a document or add a URL to start building your project
              knowledge.
            </p>
          </div>
        </div>
      )}

      {/* Sources */}
      {!loading && sources.length > 0 && (
        <div className="space-y-3">
          {sources.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* URL Modal */}
      {showUrlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">Add URL</h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add a web page to your knowledge base.
                </p>
              </div>

              <button
                onClick={() => setShowUrlModal(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddUrl} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Source type
                </label>

                <select
                  value={urlType}
                  onChange={(event) => setUrlType(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-white/25"
                >
                  <option value="blog">Blog</option>

                  <option value="article">Article</option>

                  <option value="tweet">Tweet / X</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">URL</label>

                <input
                  type="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://example.com/article"
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-white/25"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUrlModal(false)}
                  className="rounded-lg px-4 py-2.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={addingUrl}
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {addingUrl && (
                    <LoaderCircle size={16} className="animate-spin" />
                  )}

                  {addingUrl ? "Adding..." : "Add URL"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SourceCard({ source, onDelete }) {
  return (
    <div className="group flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/15 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5">
          {source.type === "blog" ||
          source.type === "article" ||
          source.type === "tweet" ? (
            <LinkIcon size={18} className="text-slate-400" />
          ) : (
            <FileText size={18} className="text-slate-400" />
          )}
        </div>

        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium text-white">
            {source.title || source.filename || source.url}
          </h3>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="uppercase">{source.type}</span>

            {source.filename && (
              <>
                <span>•</span>

                <span className="truncate">{source.filename}</span>
              </>
            )}

            {source.chunk_count > 0 && (
              <>
                <span>•</span>

                <span>{source.chunk_count} chunks</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <StatusBadge status={source.status} />

        <button
          onClick={() => onDelete(source.id)}
          className="rounded-lg p-2 text-slate-600 transition hover:bg-red-500/10 hover:text-red-400"
          title="Delete source"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === "processed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400">
        <CheckCircle2 size={13} />
        Processed
      </span>
    );
  }

  if (status === "processing") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs text-blue-400">
        <Clock3 size={13} />
        Processing
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-xs text-red-400">
        <AlertCircle size={13} />
        Failed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-400">
      <Clock3 size={13} />
      Pending
    </span>
  );
}

export default SourcesPanel;
