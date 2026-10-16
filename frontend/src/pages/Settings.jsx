import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Settings as SettingsIcon,
  UserRound,
  BrainCircuit,
  MessageSquare,
  FileText,
  ChevronRight,
  Moon,
  RotateCcw,
  Check,
} from "lucide-react";

const DEFAULT_SETTINGS = {
  responseStyle: "balanced",
  defaultContentType: "blog",
  showCitations: true,
};

function Settings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("insightflow-settings");

      if (stored) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...JSON.parse(stored),
        });
      }
    } catch (error) {
      console.error("Unable to load settings:", error);
    }
  }, []);

  const updateSetting = (key, value) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
    setSaved(false);
  };

  const saveSettings = () => {
    try {
      localStorage.setItem("insightflow-settings", JSON.stringify(settings));
      setSaved(true);
    } catch (error) {
      console.error("Unable to save settings:", error);
      setSaved(false);
    }
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem("insightflow-settings");
    setSaved(true);
  };

  const selectClass =
    "w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 outline-none transition focus:border-violet-400/50";

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-5 md:p-8">
      {/* Header */}
      <div>
        <div className="mb-3 flex items-center gap-2 text-sm text-violet-300">
          <SettingsIcon size={17} />
          Preferences
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-white">
          Settings
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Customize your InsightFlow AI experience and default preferences.
        </p>
      </div>

      {/* Appearance */}
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50">
        <div className="flex items-center gap-3 border-b border-white/10 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
            <Moon size={20} />
          </div>

          <div>
            <h2 className="font-semibold text-white">Appearance</h2>
            <p className="mt-1 text-xs text-slate-400">
              Your workspace display preferences
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm font-medium text-slate-200">Dark interface</p>
            <p className="mt-1 text-xs text-slate-500">
              InsightFlow currently uses its dark interface throughout the
              workspace.
            </p>
          </div>

          <span className="shrink-0 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
            Active
          </span>
        </div>
      </section>

      {/* AI Preferences */}
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50">
        <div className="flex items-center gap-3 border-b border-white/10 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
            <BrainCircuit size={20} />
          </div>

          <div>
            <h2 className="font-semibold text-white">AI preferences</h2>
            <p className="mt-1 text-xs text-slate-400">
              Choose your preferred defaults
            </p>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <label
              htmlFor="responseStyle"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Preferred response style
            </label>

            <select
              id="responseStyle"
              value={settings.responseStyle}
              onChange={(event) =>
                updateSetting("responseStyle", event.target.value)
              }
              className={selectClass}
            >
              <option value="concise">Concise</option>
              <option value="balanced">Balanced</option>
              <option value="detailed">Detailed</option>
            </select>

            <p className="mt-2 text-xs text-slate-500">
              Preferred answer length for AI interactions.
            </p>
          </div>

          <div>
            <label
              htmlFor="contentType"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Default content type
            </label>

            <select
              id="contentType"
              value={settings.defaultContentType}
              onChange={(event) =>
                updateSetting("defaultContentType", event.target.value)
              }
              className={selectClass}
            >
              <option value="blog">Blog post</option>
              <option value="summary">Summary</option>
              <option value="report">Research report</option>
              <option value="social">Social media post</option>
            </select>

            <p className="mt-2 text-xs text-slate-500">
              Preferred starting format for content generation.
            </p>
          </div>
        </div>
      </section>

      {/* Research preferences */}
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50">
        <div className="flex items-center gap-3 border-b border-white/10 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
            <MessageSquare size={20} />
          </div>

          <div>
            <h2 className="font-semibold text-white">Research and citations</h2>
            <p className="mt-1 text-xs text-slate-400">
              Set your preferred research presentation
            </p>
          </div>
        </div>

        <label className="flex cursor-pointer items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm font-medium text-slate-200">
              Prefer source citations
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Your preference for source-backed answers and references.
            </p>
          </div>

          <input
            type="checkbox"
            checked={settings.showCitations}
            onChange={(event) =>
              updateSetting("showCitations", event.target.checked)
            }
            className="h-4 w-4 accent-violet-500"
          />
        </label>
      </section>

      {/* Account */}
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50">
        <div className="flex items-center gap-3 border-b border-white/10 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/10 text-pink-300">
            <UserRound size={20} />
          </div>

          <div>
            <h2 className="font-semibold text-white">Account</h2>
            <p className="mt-1 text-xs text-slate-400">
              Manage your personal information
            </p>
          </div>
        </div>

        <Link
          to="/my-account"
          className="flex items-center justify-between gap-3 p-5 transition hover:bg-white/[0.03]"
        >
          <div className="flex items-center gap-3">
            <FileText size={19} className="text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-200">My account</p>
              <p className="mt-1 text-xs text-slate-500">
                Update your profile and personal details.
              </p>
            </div>
          </div>

          <ChevronRight size={18} className="text-slate-500" />
        </Link>
      </section>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
        <button
          type="button"
          onClick={resetSettings}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/5"
        >
          <RotateCcw size={16} />
          Reset defaults
        </button>

        <button
          type="button"
          onClick={saveSettings}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500"
        >
          {saved ? <Check size={17} /> : null}
          {saved ? "Settings saved" : "Save settings"}
        </button>
      </div>

      <p className="text-xs leading-5 text-slate-500">
        These preferences are currently stored in this browser. They are not yet
        synchronized with your account or automatically applied to the AI
        generation and chat services.
      </p>
    </div>
  );
}

export default Settings;
