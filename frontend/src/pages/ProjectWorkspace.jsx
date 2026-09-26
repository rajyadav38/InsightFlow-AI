import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  MessageSquare,
  Search,
  Sparkles,
  Library,
  MoreHorizontal,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import SourcesPanel from "../components/SourcesPanel";
import api from "../services/api";

const workspaceTabs = [
  {
    name: "Sources",
    key: "sources",
    icon: FileText,
  },
  {
    name: "AI Chat",
    key: "chat",
    icon: MessageSquare,
  },
  {
    name: "Generate",
    key: "generate",
    icon: Sparkles,
  },
  {
    name: "Research",
    key: "research",
    icon: Search,
  },
  {
    name: "Library",
    key: "library",
    icon: Library,
  },
];

function ProjectWorkspace() {
  const { projectId } = useParams();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("sources");

  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/projects/${projectId}`);

        setProject(response.data);
      } catch (error) {
        console.error("Failed to fetch project:", error);

        setError(error.response?.data?.detail || "Unable to load project.");
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center p-8">
        <p className="text-sm text-slate-500">Loading project...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 md:p-8">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Projects
        </Link>

        <div className="mt-8 rounded-xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      {/* Project Header */}
      <div className="border-b border-white/10 px-5 py-5 md:px-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Link
              to="/projects"
              className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-white"
            >
              <ArrowLeft size={15} />
              Projects
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
                <BookOpen size={19} className="text-slate-300" />
              </div>

              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold md:text-2xl">
                  {project?.name}
                </h1>

                {project?.description && (
                  <p className="mt-1 truncate text-sm text-slate-500">
                    {project.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          <button
            className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-white"
            title="Project options"
          >
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      {/* Workspace Navigation */}
      <div className="border-b border-white/10 px-5 md:px-8">
        <div className="flex gap-1 overflow-x-auto">
          {workspaceTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm transition ${
                  isActive
                    ? "border-white text-white"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                <Icon size={16} />
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Workspace Content */}
      <div className="flex-1 p-5 md:p-8">
        {activeTab === "sources" && <SourcesPanel projectId={projectId} />}

        {activeTab === "chat" && (
          <WorkspacePlaceholder
            title="AI Chat"
            description="Ask questions and chat with the knowledge contained in your project."
            icon={MessageSquare}
          />
        )}

        {activeTab === "generate" && (
          <WorkspacePlaceholder
            title="Generate"
            description="Create tweets, LinkedIn posts, blogs, and newsletters from your sources."
            icon={Sparkles}
          />
        )}

        {activeTab === "research" && (
          <WorkspacePlaceholder
            title="Research"
            description="Run deeper research workflows across your project sources."
            icon={Search}
          />
        )}

        {activeTab === "library" && (
          <WorkspacePlaceholder
            title="Library"
            description="Access your generated content and previous outputs."
            icon={Library}
          />
        )}
      </div>
    </div>
  );
}

function WorkspacePlaceholder({ title, description, icon: Icon }) {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
      <div className="max-w-md px-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
          <Icon size={22} className="text-slate-400" />
        </div>

        <h2 className="mt-5 text-xl font-semibold">{title}</h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

export default ProjectWorkspace;
