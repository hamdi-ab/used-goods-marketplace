export {
  fetchInbox as fetchMyNotifications,
  fetchUnreadCount as fetchUnreadNotificationsCount,
  markRead as markNotificationsRead,
  markAllRead as markAllNotificationsRead,
  createNotification,
} from "@/lib/notifications/service"
export type {
  NotificationRow,
  MarkReadResult,
  CreateNotificationParams,
} from "@/lib/notifications/service"
export * from "@/lib/notifications/constants"
