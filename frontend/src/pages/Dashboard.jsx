import { FolderKanban, FileText, MessageSquare, Sparkles } from "lucide-react";

const stats = [
  {
    title: "Projects",
    value: "0",
    icon: FolderKanban,
  },
  {
    title: "Sources",
    value: "0",
    icon: FileText,
  },
  {
    title: "Conversations",
    value: "0",
    icon: MessageSquare,
  },
  {
    title: "Generated",
    value: "0",
    icon: Sparkles,
  },
];

function Dashboard() {
  return (
    <div className="p-5 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <p className="mb-2 text-sm text-slate-500">Welcome to InsightFlow</p>

        <h1 className="text-3xl font-bold tracking-tight">
          Knowledge Intelligence
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Research, understand, and create using your own knowledge sources.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-slate-400">{stat.title}</span>

                <Icon size={19} className="text-slate-500" />
              </div>

              <p className="text-2xl font-semibold">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Empty project section */}
      <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold">Start your first project</h2>

        <p className="mt-2 max-w-xl text-sm text-slate-400">
          Create a project and add documents, articles, or other sources to
          start building your knowledge workspace.
        </p>

        <button className="mt-5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-950 hover:bg-slate-200">
          Create Project
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
