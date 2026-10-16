import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Bot,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  FileText,
  FolderKanban,
  LoaderCircle,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  Workflow,
  X,
} from "lucide-react";
import api from "../services/api";

const initialStats = [
  { title: "Projects", key: "projects", icon: FolderKanban, color: "violet" },
  { title: "Sources", key: "sources", icon: FileText, color: "blue" },
  {
    title: "Conversations",
    key: "conversations",
    icon: MessageSquare,
    color: "emerald",
  },
  {
    title: "Generated content",
    key: "generated",
    icon: Sparkles,
    color: "fuchsia",
  },
];

const statColors = {
  violet: "bg-violet-500/10 text-violet-300",
  blue: "bg-blue-500/10 text-blue-300",
  emerald: "bg-emerald-500/10 text-emerald-300",
  fuchsia: "bg-fuchsia-500/10 text-fuchsia-300",
};

const workflows = [
  {
    title: "Chat with your knowledge",
    description:
      "Ask questions and get source-grounded answers with citations.",
    icon: MessageSquare,
    label: "RAG CHAT",
    color: "violet",
    action: "chat",
  },
  {
    title: "Research with AI agents",
    description:
      "Explore your sources and turn findings into structured research.",
    icon: Workflow,
    label: "LANGGRAPH",
    color: "blue",
    action: "research",
  },
  {
    title: "Generate content",
    description:
      "Transform retrieved knowledge into useful, structured content.",
    icon: Sparkles,
    label: "AI GENERATION",
    color: "fuchsia",
    action: "generate",
  },
];

function getArray(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function formatDate(value) {
  if (!value) return "Recently created";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently created";

  return date.toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Dashboard() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    projects: 0,
    sources: 0,
    conversations: 0,
    generated: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [query, setQuery] = useState("");

  const loadDashboard = useCallback(async (quiet = false) => {
    try {
      if (quiet) setRefreshing(true);
      else setLoading(true);

      setError("");

      const projectResponse = await api.get("/projects");
      const projectList = getArray(projectResponse.data, "projects");

      setProjects(projectList);

      const totals = {
        projects: projectList.length,
        sources: 0,
        conversations: 0,
        generated: 0,
      };

      // Aggregate data using existing project-scoped endpoints.
      // One project's unavailable optional endpoint won't break the dashboard.
      const counts = await Promise.all(
        projectList.map(async (project) => {
          const id = project.id || project._id;

          if (!id) {
            return { sources: 0, conversations: 0, generated: 0 };
          }

          const results = await Promise.allSettled([
            api.get(`/projects/${id}/sources`),
            api.get(`/projects/${id}/conversations`),
            api.get(`/projects/${id}/generated`),
          ]);

          const sourceData =
            results[0].status === "fulfilled" ? results[0].value.data : [];
          const conversationData =
            results[1].status === "fulfilled" ? results[1].value.data : [];
          const generatedData =
            results[2].status === "fulfilled" ? results[2].value.data : [];

          return {
            sources: getArray(sourceData, "sources").length,
            conversations: getArray(conversationData, "conversations").length,
            generated:
              getArray(generatedData, "generated_content").length ||
              getArray(generatedData, "items").length ||
              getArray(generatedData, "content").length,
          };
        }),
      );

      counts.forEach((item) => {
        totals.sources += item.sources;
        totals.conversations += item.conversations;
        totals.generated += item.generated;
      });

      setStats(totals);
    } catch (err) {
      console.error("Dashboard loading failed:", err);
      setError(
        err.response?.data?.detail ||
          "Unable to load your dashboard. Please try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function handleCreateProject(event) {
    event.preventDefault();

    const name = projectName.trim();

    if (!name) {
      setCreateError("Please enter a project name.");
      return;
    }

    try {
      setCreating(true);
      setCreateError("");

      const response = await api.post("/projects", {
        name,
        description: projectDescription.trim(),
      });

      const createdProject = response.data;
      const id = createdProject.id || createdProject._id;

      setModalOpen(false);
      setProjectName("");
      setProjectDescription("");

      await loadDashboard(true);

      if (id) {
        navigate(`/projects/${id}`);
      } else {
        navigate("/projects");
      }
    } catch (err) {
      console.error("Project creation failed:", err);
      setCreateError(
        err.response?.data?.detail ||
          "Unable to create the project. Please try again.",
      );
    } finally {
      setCreating(false);
    }
  }

  function openWorkflow(action, project) {
    const id = project?.id || project?._id;

    if (!id) {
      setModalOpen(true);
      return;
    }

    if (action === "chat") {
      navigate(`/projects/${id}/chat`);
      return;
    }

    // Research and Generate are tabs within the project workspace.
    navigate(`/projects/${id}`, {
      state: { activeTab: action },
    });
  }

  const filteredProjects = projects.filter((project) => {
    const searchText = query.trim().toLowerCase();
    if (!searchText) return true;

    return `${project.name || ""} ${project.description || ""}`
      .toLowerCase()
      .includes(searchText);
  });

  const latestProjects = [...filteredProjects].slice(0, 4);
  const hasProjects = projects.length > 0;

  return (
    <div className="min-h-full p-5 md:p-8">
      {/* Page heading */}
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/15 bg-violet-500/[0.07] px-3 py-1.5 text-xs font-medium text-violet-300">
            <Sparkles size={13} />
            AI KNOWLEDGE WORKSPACE
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Knowledge Intelligence
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Connect your knowledge, retrieve reliable answers, and orchestrate
            AI agents to turn information into insights.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => loadDashboard(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
          >
            <Activity size={16} className={refreshing ? "animate-pulse" : ""} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              setCreateError("");
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500"
          >
            <Plus size={17} />
            New project
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 flex items-center gap-3 rounded-xl border border-red-400/20 bg-red-500/[0.08] p-4 text-sm text-red-300"
        >
          <CircleAlert size={18} />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => loadDashboard()}
            className="font-medium underline underline-offset-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* Live statistics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {initialStats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.key}
              className="group rounded-2xl border border-white/[0.09] bg-slate-900/55 p-5 transition hover:border-violet-400/20 hover:bg-slate-900/90"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">{stat.title}</span>
                <span className={`rounded-xl p-2.5 ${statColors[stat.color]}`}>
                  <Icon size={19} />
                </span>
              </div>

              <div className="mt-5 flex items-end justify-between">
                <p className="text-3xl font-semibold tracking-tight text-white">
                  {loading ? (
                    <span className="inline-block h-9 w-12 animate-pulse rounded-md bg-white/10" />
                  ) : (
                    stats[stat.key].toLocaleString()
                  )}
                </p>
                <span className="text-xs text-slate-500">
                  Across your workspace
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI capability showcase */}
      <section className="mt-9">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
              Your AI toolkit
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              From knowledge to intelligence
            </h2>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {workflows.map((workflow) => {
            const Icon = workflow.icon;
            const iconColor =
              workflow.color === "violet"
                ? "bg-violet-500/10 text-violet-300"
                : workflow.color === "blue"
                  ? "bg-blue-500/10 text-blue-300"
                  : "bg-fuchsia-500/10 text-fuchsia-300";

            return (
              <button
                key={workflow.action}
                type="button"
                onClick={() => openWorkflow(workflow.action, projects[0])}
                className="group flex min-h-[190px] flex-col rounded-2xl border border-white/[0.09] bg-slate-900/45 p-5 text-left transition hover:-translate-y-0.5 hover:border-violet-400/25 hover:bg-slate-900/80"
              >
                <div className="flex items-center justify-between">
                  <span className={`rounded-xl p-3 ${iconColor}`}>
                    <Icon size={21} />
                  </span>
                  <span className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-slate-500">
                    {workflow.label}
                  </span>
                </div>

                <h3 className="mt-5 font-semibold text-white">
                  {workflow.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {workflow.description}
                </p>

                <span className="mt-auto flex items-center gap-2 pt-4 text-xs font-medium text-violet-300">
                  {hasProjects ? "Open workflow" : "Create a project to start"}
                  <ArrowRight
                    size={14}
                    className="transition group-hover:translate-x-1"
                  />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Projects */}
      <section className="mt-9">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Your workspace
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              Recent projects
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Continue building on your connected knowledge.
            </p>
          </div>

          <div className="flex gap-2">
            <label className="relative block">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter projects..."
                aria-label="Filter projects"
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/40 sm:w-56"
              />
            </label>

            <button
              type="button"
              onClick={() => navigate("/projects")}
              className="shrink-0 rounded-xl border border-white/10 px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/5"
            >
              All projects
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="h-36 animate-pulse rounded-2xl border border-white/[0.08] bg-white/[0.025]"
              />
            ))}
          </div>
        ) : latestProjects.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {latestProjects.map((project) => {
              const id = project.id || project._id;

              return (
                <button
                  type="button"
                  key={id}
                  onClick={() => id && navigate(`/projects/${id}`)}
                  className="group flex min-w-0 items-start gap-4 rounded-2xl border border-white/[0.09] bg-slate-900/50 p-5 text-left transition hover:border-violet-400/25 hover:bg-slate-900/85"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-violet-400/15 bg-gradient-to-br from-violet-500/15 to-indigo-500/10 text-violet-300">
                    <FolderKanban size={21} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="truncate font-semibold text-white">
                        {project.name || "Untitled project"}
                      </h3>
                      <ArrowRight
                        size={16}
                        className="mt-0.5 shrink-0 text-slate-500 transition group-hover:translate-x-1 group-hover:text-violet-300"
                      />
                    </div>

                    <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-400">
                      {project.description ||
                        "Build a knowledge workspace with your sources and AI agents."}
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                      <BookOpen size={13} />
                      {formatDate(project.created_at)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/30 px-5 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-400/15 bg-violet-500/10 text-violet-300">
              <Bot size={26} />
            </div>

            <h3 className="mt-5 text-lg font-semibold text-white">
              {query
                ? "No matching projects"
                : "Your knowledge workspace starts here"}
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-400">
              {query
                ? "Try a different search term or clear your filter."
                : "Create a project, ingest documents or URLs, and start asking questions with retrieval-augmented generation."}
            </p>

            <button
              type="button"
              onClick={() => {
                if (query) setQuery("");
                else setModalOpen(true);
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              <Plus size={16} />
              {query ? "Clear search" : "Create your first project"}
            </button>
          </div>
        )}
      </section>

      {/* Create project modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !creating) {
              setModalOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-project-title"
            className="my-auto w-full max-w-lg rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl shadow-black/50 sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                  <FolderKanban size={21} />
                </div>
                <h2
                  id="create-project-title"
                  className="text-xl font-semibold text-white"
                >
                  Create a project
                </h2>
                <p className="mt-2 text-sm leading-5 text-slate-400">
                  Give your knowledge workspace a name and a purpose.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={creating}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="mt-6 space-y-5">
              {createError && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-400/20 bg-red-500/[0.08] p-3 text-sm text-red-300"
                >
                  {Array.isArray(createError)
                    ? createError.map((e) => e.msg).join(", ")
                    : createError}
                </div>
              )}

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">
                  Project name <span className="text-violet-300">*</span>
                </span>
                <input
                  autoFocus
                  required
                  minLength={2}
                  maxLength={100}
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  placeholder="e.g. AI Research Assistant"
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/50"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">
                  Description <span className="text-slate-500">(optional)</span>
                </span>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={projectDescription}
                  onChange={(event) =>
                    setProjectDescription(event.target.value)
                  }
                  placeholder="What knowledge will this project organize?"
                  className="w-full resize-y rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/50"
                />
              </label>

              <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={creating}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !projectName.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <Plus size={16} />
                  )}
                  {creating ? "Creating..." : "Create project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
