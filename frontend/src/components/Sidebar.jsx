import {
  LayoutDashboard,
  FolderKanban,
  MessageSquare,
  FileText,
  Sparkles,
  Search,
  Library,
  Settings,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const navigation = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Projects",
    path: "/projects",
    icon: FolderKanban,
  },
  {
    name: "AI Chat",
    path: "/chat",
    icon: MessageSquare,
  },
  {
    name: "Sources",
    path: "/sources",
    icon: FileText,
  },
  {
    name: "Generate",
    path: "/generate",
    icon: Sparkles,
  },
  {
    name: "Research",
    path: "/research",
    icon: Search,
  },
  {
    name: "Library",
    path: "/library",
    icon: Library,
  },
];

function Sidebar() {
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-white/10 bg-slate-950">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-white/10">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            InsightFlow
          </h1>

          <p className="text-[10px] uppercase tracking-widest text-slate-500">
            AI Intelligence
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/10 p-3">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
        >
          <Settings size={18} />
          Settings
        </NavLink>
      </div>
    </aside>
  );
}

export default Sidebar;
