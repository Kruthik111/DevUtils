"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const shownNotificationsRef = useRef<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    // Load previously shown notifications from localStorage
    const storedShown = localStorage.getItem("shownNotifications");
    if (storedShown) {
      try {
        shownNotificationsRef.current = new Set(JSON.parse(storedShown));
      } catch {
        shownNotificationsRef.current = new Set();
      }
    }

    fetchNotifications();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const saveShownNotifications = () => {
    localStorage.setItem(
      "shownNotifications",
      JSON.stringify(Array.from(shownNotificationsRef.current))
    );
  };

  const showBrowserNotification = async (notification: Notification) => {
    if (!("Notification" in window)) return;
    // Ask only when there is actually something new to show
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
    if (Notification.permission === "granted") {
      const browserNotif = new Notification(notification.title, {
        body: notification.message,
        tag: notification._id,
        requireInteraction: false,
      });

      browserNotif.onclick = () => {
        window.focus();
        if (notification.link) {
          router.push(notification.link);
        }
        browserNotif.close();
      };
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications");
      if (response.ok) {
        const data = await response.json();
        const newNotifications = data.notifications || [];

        // Show browser notifications for new unread notifications
        newNotifications.forEach((notification: Notification) => {
          if (!notification.read && !shownNotificationsRef.current.has(notification._id)) {
            showBrowserNotification(notification);
            shownNotificationsRef.current.add(notification._id);
          }
        });

        saveShownNotifications();
        setNotifications(newNotifications);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Poll for new notifications every 15 seconds
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch("/api/notifications/mark-read", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        shownNotificationsRef.current.add(notificationId);
        saveShownNotifications();
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/mark-read", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });

      if (response.ok) {
        // Update local state
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    if (notification.link) {
      router.push(notification.link);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-8 w-8"
      >
        <Bell className="w-4 h-4 text-foreground/70" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-purple-600 px-1 text-[10px] font-medium leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-background border border-border/50 rounded-lg shadow-xl z-50 max-h-[calc(100vh-5rem)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <h3 className="text-sm font-semibold text-foreground">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 text-xs text-foreground/60">
                    ({unreadCount} unread)
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={markAllAsRead}
                    className="h-8 w-8"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-4 h-4 text-foreground/70" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4 text-foreground/70" />
                </Button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-foreground/60">
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-foreground/60">
                  No notifications
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {notifications.map((notification) => (
                    <button
                      key={notification._id}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "w-full p-4 text-left hover:bg-foreground/5 transition-colors",
                        notification.read
                          ? "text-foreground/60"
                          : "text-foreground"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full mt-2 shrink-0",
                            notification.read
                              ? "bg-transparent"
                              : "bg-purple-600"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <div
                            className={cn(
                              "text-sm font-medium mb-1",
                              notification.read
                                ? "text-foreground/60"
                                : "text-foreground"
                            )}
                          >
                            {notification.title}
                          </div>
                          <div
                            className={cn(
                              "text-xs line-clamp-2",
                              notification.read
                                ? "text-foreground/50"
                                : "text-foreground/70"
                            )}
                            title={notification.message}
                          >
                            {notification.message}
                          </div>
                          <div className="text-xs text-foreground/60 mt-1">
                            {new Date(notification.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              }
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
