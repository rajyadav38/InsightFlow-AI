import { Bell, Search, UserCircle } from "lucide-react";

function Topbar() {
  return (
    <header className="h-16 shrink-0 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        {/* Search */}
        <div className="relative w-full max-w-md">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />

          <input
            type="text"
            placeholder="Search projects, sources..."
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-white/20"
          />
        </div>

        {/* Right side */}
        <div className="ml-4 flex items-center gap-2">
          <button className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white">
            <Bell size={19} />
          </button>

          <button className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white">
            <UserCircle size={21} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
