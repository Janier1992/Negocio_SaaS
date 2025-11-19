import React, { createContext } from "react";

export type NotificationItem = {
  id: string;
  message: string;
  type: "info" | "stock_bajo" | "stock_critico" | string;
  createdAt: number;
  read?: boolean;
};

export type NotificationsContextType = {
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (n: Omit<NotificationItem, "id" | "createdAt">) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
};

export const NotificationsContext = createContext<NotificationsContextType | null>(null);
