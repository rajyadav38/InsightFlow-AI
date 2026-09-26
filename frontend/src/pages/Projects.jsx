import { useEffect, useState } from "react";
import { FolderKanban, Plus, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

function Projects() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");

  // --------------------------------
  // Fetch projects
  // --------------------------------

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/projects");

      setProjects(response.data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);

      setError("Unable to load your projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // --------------------------------
  // Create project
  // --------------------------------

  const handleCreateProject = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    try {
      setCreating(true);
      setError("");

      await api.post("/projects", {
        name: name.trim(),
        description: description.trim() || null,
      });

      setName("");
      setDescription("");

      setShowModal(false);

      await fetchProjects();
    } catch (error) {
      console.error("Failed to create project:", error);

      setError(error.response?.data?.detail || "Unable to create project.");
    } finally {
      setCreating(false);
    }
  };

  // --------------------------------
  // Delete project
  // --------------------------------

  const handleDeleteProject = async (projectId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/projects/${projectId}`);

      setProjects((currentProjects) =>
        currentProjects.filter((project) => project.id !== projectId),
      );
    } catch (error) {
      console.error("Failed to delete project:", error);

      setError(error.response?.data?.detail || "Unable to delete project.");
    }
  };

  return (
    <div className="p-5 md:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>

          <p className="mt-2 text-sm text-slate-400">
            Organize your sources, conversations, research, and generated
            content.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
        >
          <Plus size={17} />
          New Project
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-slate-500">Loading projects...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && projects.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/10 p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
            <FolderKanban size={23} className="text-slate-400" />
          </div>

          <h2 className="mt-5 text-lg font-semibold">No projects yet</h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Create your first project to start building your knowledge
            workspace.
          </p>

          <button
            onClick={() => setShowModal(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-slate-200"
          >
            <Plus size={17} />
            Create Project
          </button>
        </div>
      )}

      {/* Project cards */}
      {!loading && projects.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group relative rounded-xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              <button
                onClick={() => handleDeleteProject(project.id)}
                className="absolute right-4 top-4 rounded-lg p-2 text-slate-600 opacity-0 transition hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                title="Delete project"
              >
                <Trash2 size={16} />
              </button>

              <button
                onClick={() => navigate(`/projects/${project.id}`)}
                className="block w-full text-left"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                  <FolderKanban size={19} className="text-slate-300" />
                </div>

                <h2 className="mt-4 truncate text-lg font-semibold text-white">
                  {project.name}
                </h2>

                <p className="mt-2 line-clamp-2 min-h-[40px] text-sm text-slate-500">
                  {project.description || "No description provided."}
                </p>

                <p className="mt-5 text-xs text-slate-600">
                  Created {new Date(project.created_at).toLocaleDateString()}
                </p>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">Create Project</h2>

                <p className="mt-1 text-sm text-slate-500">
                  Create a workspace for your knowledge.
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Project name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. AI Research"
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-white/25"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What is this project about?"
                  rows={4}
                  className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-white/25"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg px-4 py-2.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Projects;
