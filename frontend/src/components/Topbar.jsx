import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  Search,
  UserCircle,
  ChevronDown,
  UserRound,
  Settings,
  LogOut,
  ShieldCheck,
  CircleHelp,
  Check,
  CheckCheck,
  FileText,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Trash2,
  Clock3,
  Inbox,
  ExternalLink,
  X,
  LoaderCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "../services/notificationService";

function formatTime(date) {
  if (!date) return "";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";

  const diff = Math.max(0, Date.now() - parsed.getTime());
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return parsed.toLocaleDateString();
}

function notificationIcon(type) {
  if (type === "success") {
    return {
      Icon: Check,
      style: "bg-emerald-500/10 text-emerald-300",
    };
  }

  if (type === "error") {
    return {
      Icon: AlertCircle,
      style: "bg-red-500/10 text-red-300",
    };
  }

  if (type === "research" || type === "generation") {
    return {
      Icon: Sparkles,
      style: "bg-violet-500/10 text-violet-300",
    };
  }

  return {
    Icon: FileText,
    style: "bg-blue-500/10 text-blue-300",
  };
}

function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const [notificationActionId, setNotificationActionId] = useState(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  const fetchNotifications = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setNotificationsLoading(true);
      setNotificationsError("");

      const result = await getNotifications();

      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch (error) {
      console.error("Failed to load notifications:", error);

      setNotificationsError(
        error.response?.data?.detail ||
          "Unable to load notifications. Try refreshing.",
      );
    } finally {
      if (showLoader) setNotificationsLoading(false);
    }
  }, []);

  // Load notifications when the topbar mounts.
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Refresh while the dropdown is open.
  useEffect(() => {
    if (notificationsOpen) {
      fetchNotifications(true);
    }
  }, [notificationsOpen, fetchNotifications]);

  // Close menus on outside click or Escape.
  useEffect(() => {
    function handlePointerDown(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setProfileOpen(false);
        setNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const displayName =
    user?.name ||
    user?.full_name ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "My Account";

  const email = user?.email || "Signed-in account";

  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const handleLogout = () => {
    if (loggingOut) return;

    setLoggingOut(true);
    setProfileOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  async function handleMarkRead(notification) {
    if (notification.read) return;

    try {
      setNotificationActionId(notification.id);

      await markNotificationRead(notification.id);

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, read: true } : item,
        ),
      );

      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      setNotificationsError("Couldn't mark this notification as read.");
    } finally {
      setNotificationActionId(null);
    }
  }

  async function handleMarkAllRead() {
    if (unreadCount === 0 || markingAllRead) return;

    try {
      setMarkingAllRead(true);

      await markAllNotificationsRead();

      setNotifications((current) =>
        current.map((item) => ({ ...item, read: true })),
      );

      setUnreadCount(0);
      setNotificationsError("");
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      setNotificationsError("Couldn't mark all notifications as read.");
    } finally {
      setMarkingAllRead(false);
    }
  }

  async function handleDeleteNotification(event, notification) {
    event.stopPropagation();

    try {
      setNotificationActionId(notification.id);

      await deleteNotification(notification.id);

      setNotifications((current) =>
        current.filter((item) => item.id !== notification.id),
      );

      if (!notification.read) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }

      setNotificationsError("");
    } catch (error) {
      console.error("Failed to delete notification:", error);
      setNotificationsError("Couldn't delete this notification.");
    } finally {
      setNotificationActionId(null);
    }
  }

  async function handleNotificationClick(notification) {
    await handleMarkRead(notification);

    setNotificationsOpen(false);

    if (notification.project_id) {
      navigate(`/projects/${notification.project_id}`);
    }
  }

  return (
    <header className="relative z-30 h-16 shrink-0 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between gap-3 px-4 md:px-6">
        {/* Search */}
        <div className="relative w-full max-w-md">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />

          <input
            type="search"
            placeholder="Search projects, sources..."
            aria-label="Search projects and sources"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-400/50 focus:bg-white/[0.06]"
          />
        </div>

        <div className="ml-2 flex shrink-0 items-center gap-1 sm:gap-2">
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen((open) => !open);
                setProfileOpen(false);
              }}
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
              aria-expanded={notificationsOpen}
              className={`relative rounded-xl p-2.5 transition ${
                notificationsOpen
                  ? "bg-violet-500/10 text-violet-300"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Bell size={19} />

              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-slate-950 bg-violet-500 px-1 text-[9px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 top-full mt-3 w-[min(390px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/50">
                {/* Header */}
                <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
                  <div>
                    <h3 className="font-semibold text-white">Notifications</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {unreadCount
                        ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                        : "You're all caught up"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => fetchNotifications(true)}
                      disabled={notificationsLoading}
                      title="Refresh notifications"
                      aria-label="Refresh notifications"
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
                    >
                      <RefreshCw
                        size={15}
                        className={notificationsLoading ? "animate-spin" : ""}
                      />
                    </button>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        disabled={markingAllRead}
                        title="Mark all as read"
                        aria-label="Mark all notifications as read"
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-violet-300 disabled:opacity-50"
                      >
                        {markingAllRead ? (
                          <LoaderCircle size={16} className="animate-spin" />
                        ) : (
                          <CheckCheck size={16} />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {notificationsError && (
                  <div className="m-3 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
                    <AlertCircle size={15} className="mt-0.5 shrink-0" />
                    <span className="flex-1">{notificationsError}</span>
                    <button
                      type="button"
                      onClick={() => setNotificationsError("")}
                      aria-label="Dismiss error"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Notification list */}
                <div className="max-h-[420px] overflow-y-auto">
                  {notificationsLoading && notifications.length === 0 ? (
                    <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400">
                      <LoaderCircle size={18} className="animate-spin" />
                      Loading notifications...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-6 py-10 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
                        <Inbox size={22} className="text-slate-500" />
                      </div>

                      <p className="mt-3 text-sm font-medium text-slate-300">
                        No notifications yet
                      </p>

                      <p className="mx-auto mt-1 max-w-[240px] text-xs leading-5 text-slate-500">
                        Source processing updates and other activity will appear
                        here.
                      </p>
                    </div>
                  ) : (
                    notifications.map((notification) => {
                      const { Icon, style } = notificationIcon(
                        notification.type,
                      );

                      const isBusy = notificationActionId === notification.id;

                      return (
                        <div
                          key={notification.id}
                          className={`group flex items-start gap-3 border-b border-white/[0.06] px-3 py-3 transition hover:bg-white/[0.035] ${
                            !notification.read ? "bg-violet-500/[0.035]" : ""
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              handleNotificationClick(notification)
                            }
                            className="flex min-w-0 flex-1 items-start gap-3 text-left"
                          >
                            <span
                              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${style}`}
                            >
                              <Icon size={17} />
                            </span>

                            <span className="min-w-0 flex-1">
                              <span className="flex items-start gap-2">
                                <span className="break-words text-sm font-medium text-slate-200">
                                  {notification.title}
                                </span>

                                {!notification.read && (
                                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                                )}
                              </span>

                              <span className="mt-1 block break-words text-xs leading-5 text-slate-400">
                                {notification.message}
                              </span>

                              <span className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
                                <Clock3 size={11} />
                                {formatTime(notification.created_at)}
                                {notification.project_id && (
                                  <>
                                    <span className="mx-1">·</span>
                                    <ExternalLink size={10} />
                                    Open project
                                  </>
                                )}
                              </span>
                            </span>
                          </button>

                          <div className="flex shrink-0 flex-col gap-1">
                            {!notification.read && (
                              <button
                                type="button"
                                onClick={() => handleMarkRead(notification)}
                                disabled={isBusy}
                                title="Mark as read"
                                aria-label="Mark notification as read"
                                className="rounded-md p-1.5 text-slate-500 opacity-100 transition hover:bg-white/5 hover:text-violet-300 sm:opacity-0 sm:group-hover:opacity-100 disabled:opacity-50"
                              >
                                {isBusy ? (
                                  <LoaderCircle
                                    size={14}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Check size={14} />
                                )}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(event) =>
                                handleDeleteNotification(event, notification)
                              }
                              disabled={isBusy}
                              title="Delete notification"
                              aria-label="Delete notification"
                              className="rounded-md p-1.5 text-slate-500 opacity-100 transition hover:bg-red-500/10 hover:text-red-300 sm:opacity-0 sm:group-hover:opacity-100 disabled:opacity-50"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
                    <span className="text-[11px] text-slate-500">
                      Showing {notifications.length} recent notifications
                    </span>

                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      disabled={unreadCount === 0 || markingAllRead}
                      className="text-xs text-violet-400 transition hover:text-violet-300 disabled:cursor-default disabled:opacity-40"
                    >
                      Mark all read
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => {
                setProfileOpen((open) => !open);
                setNotificationsOpen(false);
              }}
              aria-label="Open profile menu"
              aria-expanded={profileOpen}
              className={`flex items-center gap-2 rounded-xl border p-1.5 transition ${
                profileOpen
                  ? "border-violet-400/30 bg-violet-500/10"
                  : "border-transparent hover:border-white/10 hover:bg-white/5"
              }`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-semibold text-white">
                {initials || <UserCircle size={20} />}
              </div>

              <ChevronDown
                size={15}
                className={`hidden text-slate-400 transition sm:block ${
                  profileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-3 w-[min(320px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/50">
                <div className="bg-gradient-to-br from-violet-500/10 via-transparent to-indigo-500/10 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white">
                      {initials || <UserCircle size={23} />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-white">
                        {displayName}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-400">
                        {email}
                      </p>

                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-2 py-1">
                        <ShieldCheck size={12} className="text-emerald-400" />
                        <span className="text-[10px] font-medium text-emerald-300">
                          Signed in
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10 p-2">
                  <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Account
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate("/my-account");
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                  >
                    <UserRound size={17} className="text-slate-400" />
                    <span className="flex-1">My account</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate("/settings");
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                  >
                    <Settings size={17} className="text-slate-400" />
                    <span className="flex-1">Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      window.open(
                        "https://github.com/rajyadav38/InsightFlow-AI",
                        "_blank",
                        "noopener,noreferrer",
                      );
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                  >
                    <CircleHelp size={17} className="text-slate-400" />
                    <span className="flex-1">Project & help</span>
                  </button>
                </div>

                <div className="border-t border-white/10 p-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-300 transition hover:bg-red-500/10 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <LogOut size={17} />
                    <span>{loggingOut ? "Logging out..." : "Log out"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
