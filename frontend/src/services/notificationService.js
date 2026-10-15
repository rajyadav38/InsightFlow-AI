import api from "./api";

export async function getNotifications() {
  const response = await api.get("/notifications");

  // Supports either a plain array or an object response.
  const data = response.data;

  return {
    notifications: Array.isArray(data) ? data : data.notifications || [],
    unreadCount: Array.isArray(data)
      ? data.filter((item) => !item.read).length
      : (data.unread_count ?? 0),
  };
}

export async function markNotificationRead(notificationId) {
  await api.patch(`/notifications/${notificationId}/read`);
}

export async function markAllNotificationsRead() {
  await api.patch("/notifications/read-all");
}

export async function deleteNotification(notificationId) {
  await api.delete(`/notifications/${notificationId}`);
}
