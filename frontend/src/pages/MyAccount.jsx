import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleUserRound,
  Globe,
  LoaderCircle,
  MapPin,
  Save,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const emptyProfile = {
  name: "",
  email: "",
  bio: "",
  job_title: "",
  organization: "",
  location: "",
  website: "",
  interests: [],
  created_at: null,
};

const suggestedInterests = [
  "Artificial Intelligence",
  "Machine Learning",
  "Research",
  "Technology",
  "Data Science",
  "Writing",
  "Business",
  "Education",
];

function getInitials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U"
  );
}

function formatMemberDate(date) {
  if (!date) return "Member";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Member";

  return `Member since ${parsed.toLocaleDateString("en", {
    month: "long",
    year: "numeric",
  })}`;
}

export default function MyAccount() {
  const { user, updateUser } = useAuth();

  const [profile, setProfile] = useState(emptyProfile);
  const [original, setOriginal] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [interestInput, setInterestInput] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/auth/profile");
        if (!active) return;

        const next = {
          ...emptyProfile,
          ...response.data,
          interests: Array.isArray(response.data.interests)
            ? response.data.interests
            : [],
        };

        setProfile(next);
        setOriginal(next);
      } catch (err) {
        if (!active) return;
        setError(
          err.response?.data?.detail ||
            "We couldn't load your profile. Please try again.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      active = false;
    };
  }, []);

  const dirty = useMemo(
    () => JSON.stringify(profile) !== JSON.stringify(original),
    [profile, original],
  );

  const completedFields = [
    profile.name,
    profile.bio,
    profile.job_title,
    profile.organization,
    profile.location,
    profile.website,
    profile.interests.length > 0,
  ].filter(Boolean).length;

  const completion = Math.round((completedFields / 7) * 100);

  function updateField(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
    setSuccess("");
    setError("");
  }

  function addInterest(value) {
    const interest = value.trim();

    if (!interest) return;

    if (interest.length > 40) {
      setError("Interest names must be 40 characters or fewer.");
      return;
    }

    if (
      profile.interests.some(
        (item) => item.toLowerCase() === interest.toLowerCase(),
      )
    ) {
      setInterestInput("");
      return;
    }

    if (profile.interests.length >= 12) {
      setError("You can add up to 12 interests.");
      return;
    }

    updateField("interests", [...profile.interests, interest]);
    setInterestInput("");
  }

  function removeInterest(interest) {
    updateField(
      "interests",
      profile.interests.filter((item) => item !== interest),
    );
  }

  function cancelChanges() {
    setProfile(original);
    setInterestInput("");
    setError("");
    setSuccess("");
  }

  async function saveProfile(event) {
    event.preventDefault();

    if (!profile.name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (profile.website.trim()) {
      try {
        const url = new URL(
          /^https?:\/\//i.test(profile.website)
            ? profile.website
            : `https://${profile.website}`,
        );

        if (!["http:", "https:"].includes(url.protocol)) {
          throw new Error("Invalid website");
        }
      } catch {
        setError("Enter a valid website, such as https://example.com.");
        return;
      }
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        name: profile.name.trim(),
        bio: profile.bio.trim(),
        job_title: profile.job_title.trim(),
        organization: profile.organization.trim(),
        location: profile.location.trim(),
        website: profile.website.trim(),
        interests: profile.interests,
      };

      const response = await api.patch("/auth/profile", payload);
      const next = {
        ...emptyProfile,
        ...response.data,
        interests: Array.isArray(response.data.interests)
          ? response.data.interests
          : [],
      };

      setProfile(next);
      setOriginal(next);
      updateUser?.(response.data);
      setSuccess("Your profile has been saved successfully.");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "We couldn't save your changes. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  const displayName = profile.name || user?.name || "Your name";

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-400">
        <LoaderCircle className="mr-3 animate-spin" size={22} />
        Loading your account...
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-7 pb-12">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
          <span>Workspace</span>
          <ChevronRight size={13} />
          <span className="text-violet-300">My account</span>
        </div>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="rounded-xl border border-violet-400/20 bg-violet-500/10 p-2 text-violet-300">
                <CircleUserRound size={20} />
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
                Account center
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              My account
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Make InsightFlow AI yours. Manage your profile and tell us what
              you're interested in exploring.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck size={15} className="text-emerald-400" />
            Your account, your information
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-500/[0.08] p-4 text-sm text-red-300"
        >
          <X size={17} className="mt-0.5 shrink-0" />
          <span>
            {Array.isArray(error) ? error.map((e) => e.msg).join(", ") : error}
          </span>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.08] p-4 text-sm text-emerald-300"
        >
          <Check size={17} />
          {success}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <form onSubmit={saveProfile} className="min-w-0 space-y-6">
          <section className="overflow-hidden rounded-2xl border border-white/[0.09] bg-slate-900/60">
            <div className="h-28 bg-gradient-to-r from-violet-600/30 via-indigo-500/15 to-slate-900" />

            <div className="px-5 pb-5 sm:px-7">
              <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-end gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-slate-900 bg-gradient-to-br from-violet-500 to-indigo-600 text-2xl font-bold text-white shadow-xl">
                    {getInitials(displayName)}
                  </div>
                  <div className="min-w-0 pb-1">
                    <h2 className="truncate text-xl font-semibold text-white">
                      {displayName}
                    </h2>
                    <p className="mt-1 truncate text-sm text-slate-400">
                      {profile.email || user?.email}
                    </p>
                  </div>
                </div>

                <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-1.5 text-xs text-emerald-300">
                  <ShieldCheck size={13} />
                  Account active
                </span>
              </div>

              <div className="mt-6">
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-slate-400">Profile completion</span>
                  <span className="font-medium text-violet-300">
                    {completion}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-400 transition-all"
                    style={{ width: `${completion}%` }}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/[0.09] bg-slate-900/60 p-5 sm:p-7">
            <div className="mb-6 flex items-start gap-3">
              <div className="rounded-xl bg-violet-500/10 p-2.5 text-violet-300">
                <UserRound size={19} />
              </div>
              <div>
                <h2 className="font-semibold text-white">
                  Personal information
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  This is how your profile appears in your workspace.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full name" required>
                <input
                  value={profile.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  maxLength={80}
                  required
                  placeholder="Your full name"
                  className={inputClass}
                />
              </Field>

              <Field label="Email address" hint="Cannot be changed here">
                <input
                  value={profile.email}
                  readOnly
                  className={`${inputClass} cursor-not-allowed text-slate-500`}
                />
              </Field>

              <Field label="Job title">
                <input
                  value={profile.job_title}
                  onChange={(e) => updateField("job_title", e.target.value)}
                  maxLength={100}
                  placeholder="e.g. AI Researcher, Student"
                  className={inputClass}
                />
              </Field>

              <Field label="Organization">
                <input
                  value={profile.organization}
                  onChange={(e) => updateField("organization", e.target.value)}
                  maxLength={120}
                  placeholder="Company, university, or team"
                  className={inputClass}
                />
              </Field>

              <Field label="Location">
                <input
                  value={profile.location}
                  onChange={(e) => updateField("location", e.target.value)}
                  maxLength={100}
                  placeholder="City, country"
                  className={inputClass}
                />
              </Field>

              <Field label="Website or portfolio">
                <div className="relative">
                  <Globe
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    value={profile.website}
                    onChange={(e) => updateField("website", e.target.value)}
                    maxLength={200}
                    placeholder="https://yourwebsite.com"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </Field>

              <div className="sm:col-span-2">
                <Field label="About you" hint={`${profile.bio.length}/300`}>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => updateField("bio", e.target.value)}
                    maxLength={300}
                    rows={4}
                    placeholder="Tell us what you work on, what you are learning, or what you hope to discover..."
                    className={`${inputClass} resize-y`}
                  />
                </Field>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/[0.09] bg-slate-900/60 p-5 sm:p-7">
            <div className="mb-5 flex items-start gap-3">
              <div className="rounded-xl bg-fuchsia-500/10 p-2.5 text-fuchsia-300">
                <Sparkles size={19} />
              </div>
              <div>
                <h2 className="font-semibold text-white">Your interests</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Add the subjects you enjoy exploring. You can select
                  suggestions or create your own.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 py-1.5 pl-3 pr-2 text-xs text-violet-200"
                >
                  {interest}
                  <button
                    type="button"
                    onClick={() => removeInterest(interest)}
                    aria-label={`Remove ${interest}`}
                    className="rounded-full p-0.5 text-violet-300 hover:bg-white/10 hover:text-white"
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
              {profile.interests.length === 0 && (
                <p className="text-sm text-slate-500">
                  No interests added yet.
                </p>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <input
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addInterest(interestInput);
                  }
                }}
                maxLength={40}
                placeholder="Add a custom interest..."
                className={`${inputClass} flex-1`}
              />
              <button
                type="button"
                onClick={() => addInterest(interestInput)}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/5"
              >
                Add interest
              </button>
            </div>

            <div className="mt-5">
              <p className="mb-3 text-xs font-medium text-slate-500">
                SUGGESTED FOR YOU
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedInterests
                  .filter(
                    (item) =>
                      !profile.interests.some(
                        (existing) =>
                          existing.toLowerCase() === item.toLowerCase(),
                      ),
                  )
                  .map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => addInterest(interest)}
                      className="rounded-full border border-white/[0.09] px-3 py-1.5 text-xs text-slate-400 transition hover:border-violet-400/30 hover:bg-violet-500/[0.08] hover:text-violet-200"
                    >
                      + {interest}
                    </button>
                  ))}
              </div>
            </div>
          </section>

          <div className="sticky bottom-3 z-10 flex flex-col-reverse gap-3 rounded-2xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
            <p className="px-1 text-xs text-slate-500">
              {dirty ? "You have unsaved changes." : "All changes are saved."}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancelChanges}
                disabled={!dirty || saving}
                className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!dirty || saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              >
                {saving ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </form>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-white/[0.09] bg-slate-900/60 p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-300" />
              <h2 className="font-semibold text-white">Account details</h2>
            </div>

            <div className="mt-5 space-y-4">
              <InfoRow
                label="Account email"
                value={profile.email || "Not available"}
              />
              <InfoRow
                label="Membership"
                value={formatMemberDate(profile.created_at)}
              />
              <InfoRow
                label="Profile visibility"
                value="Private to your account"
              />
            </div>

            <div className="mt-5 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05] p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-300">
                <ShieldCheck size={14} />
                Protected account
              </div>
              <p className="mt-1.5 text-xs leading-5 text-slate-500">
                Profile updates are saved securely to your signed-in account.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-violet-400/15 bg-gradient-to-br from-violet-500/[0.10] to-indigo-500/[0.04] p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
              <Sparkles size={19} />
            </div>
            <h2 className="mt-4 font-semibold text-white">
              Make research personal
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Keep your interests and professional details up to date as your
              work evolves.
            </p>
            <a
              href="/dashboard"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-violet-300 hover:text-violet-200"
            >
              Explore your workspace
              <ArrowUpRight size={15} />
            </a>
          </section>

          <section className="rounded-2xl border border-white/[0.09] bg-slate-900/40 p-5">
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin size={16} className="text-slate-500" />
              <h2 className="text-sm font-medium">Profile tip</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Add a short bio and a few interests to make your account feel like
              yours.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/10";

function Field({ label, hint, required, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 flex items-center justify-between gap-2 text-xs font-medium text-slate-300">
        <span>
          {label}
          {required && <span className="ml-1 text-violet-300">*</span>}
        </span>
        {hint && <span className="font-normal text-slate-500">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm text-slate-300">{value}</p>
    </div>
  );
}
