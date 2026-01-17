"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  Plus,
  Send,
  Users,
  User,
  Loader2,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Loading } from "@/components/ui/loading";
import { ConfirmDialog } from "@/components/notes/confirm-dialog";

interface UserOption {
  _id: string;
  name: string;
  email: string;
}

interface Feedback {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export default function AdminNotificationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"create" | "feedbacks">("create");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);
  const [notificationForm, setNotificationForm] = useState({
    title: "",
    message: "",
    type: "info",
    link: "",
    targetType: "all", // 'all' or 'specific'
    selectedUserIds: [] as string[],
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
      return;
    }

    if (status === "authenticated" && session?.user?.email) {
      checkAdminAccess();
      fetchUsers();
    }
  }, [status, session, router]);

  // Check URL params for tab
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "feedbacks") {
      setActiveTab("feedbacks");
      fetchFeedbacks();
    }
  }, [searchParams]);

  // Fetch feedbacks when tab changes
  useEffect(() => {
    if (activeTab === "feedbacks") {
      fetchFeedbacks();
    }
  }, [activeTab]);

  const checkAdminAccess = async () => {
    try {
      const response = await fetch("/api/users/access");
      if (response.ok) {
        setIsAdmin(true);
      } else {
        router.push("/notes");
      }
    } catch (error) {
      router.push("/notes");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users/access");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchFeedbacks = async () => {
    setLoadingFeedbacks(true);
    try {
      const response = await fetch("/api/admin/feedbacks");
      if (response.ok) {
        const data = await response.json();
        setFeedbacks(data.feedbacks || []);
      }
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const payload: any = {
        title: notificationForm.title,
        message: notificationForm.message,
        type: notificationForm.type,
      };

      if (notificationForm.link) {
        payload.link = notificationForm.link;
      }

      if (notificationForm.targetType === "all") {
        payload.userIds = "all";
      } else {
        payload.userIds = notificationForm.selectedUserIds;
      }

      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send notifications");
      }

      const result = await response.json();
      alert(`Successfully sent ${result.count} notification(s)!`);
      setShowCreateModal(false);
      setNotificationForm({
        title: "",
        message: "",
        type: "info",
        link: "",
        targetType: "all",
        selectedUserIds: [],
      });
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setNotificationForm((prev) => ({
      ...prev,
      selectedUserIds: prev.selectedUserIds.includes(userId)
        ? prev.selectedUserIds.filter((id) => id !== userId)
        : [...prev.selectedUserIds, userId],
    }));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success":
        return CheckCircle;
      case "error":
        return AlertCircle;
      case "warning":
        return AlertCircle;
      default:
        return Info;
    }
  };

  if (status === "loading" || loading) {
    return <Loading fullScreen />;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
              <Bell className="w-8 h-8 text-purple-600" />
              Notification Management
            </h1>
            <p className="text-foreground/60">
              Send notifications to users or view feedback submissions
            </p>
          </div>
          {activeTab === "create" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl",
                "bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold",
                "hover:from-purple-700 hover:to-purple-800 transition-all duration-200",
                "hover:scale-105 active:scale-95",
                "shadow-lg hover:shadow-xl shadow-purple-500/30"
              )}
            >
              <Plus className="w-5 h-5" />
              Create Notification
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-border/50">
          <button
            onClick={() => setActiveTab("create")}
            className={cn(
              "px-6 py-3 font-medium transition-all border-b-2",
              activeTab === "create"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-foreground/60 hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Create Notification
            </div>
          </button>
          <button
            onClick={() => setActiveTab("feedbacks")}
            className={cn(
              "px-6 py-3 font-medium transition-all border-b-2",
              activeTab === "feedbacks"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-foreground/60 hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              View Feedbacks
              {feedbacks.length > 0 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-600">
                  {feedbacks.length}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Create Notification Tab Content */}
        {activeTab === "create" && (
          <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <Info className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  How it works
                </h3>
                <ul className="text-foreground/70 space-y-1 text-sm">
                  <li>• Regular users have a limit of 12 notifications (oldest deleted when exceeded)</li>
                  <li>• Admin users have no notification limit</li>
                  <li>• You can send notifications to all users or select specific users</li>
                  <li>• Feedback submissions automatically create notifications for all admins</li>
                  <li>• New users receive a welcome notification when they sign up</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Feedbacks Tab Content */}
        {activeTab === "feedbacks" && (
          <div>
            {loadingFeedbacks ? (
              <Loading fullScreen={false} text="Loading feedbacks..." />
            ) : feedbacks.length === 0 ? (
              <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl p-12 text-center">
                <MessageSquare className="w-12 h-12 text-foreground/30 mx-auto mb-4" />
                <p className="text-foreground/60">No feedbacks received yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {feedbacks.map((feedback) => {
                  const isExpanded = expandedFeedback === feedback._id;
                  // Extract user info from message (format: "Name (email): message")
                  const messageMatch = feedback.message.match(/^(.+?)\s*\((.+?)\):\s*(.+)$/);
                  const userName = messageMatch ? messageMatch[1] : "Unknown User";
                  const userEmail = messageMatch ? messageMatch[2] : "";
                  const feedbackMessage = messageMatch ? messageMatch[3] : feedback.message;

                  return (
                    <div
                      key={feedback._id}
                      className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden"
                    >
                      <button
                        onClick={() =>
                          setExpandedFeedback(isExpanded ? null : feedback._id)
                        }
                        className="w-full p-6 text-left hover:bg-foreground/5 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-foreground">
                                {userName}
                              </h3>
                              <span className="text-xs text-foreground/40">
                                {new Date(feedback.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                            </div>
                            <p className="text-sm text-foreground/60 mb-1">
                              {userEmail}
                            </p>
                            {!isExpanded && (
                              <p className="text-sm text-foreground/70 line-clamp-2">
                                {feedbackMessage}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-foreground/50" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-foreground/50" />
                            )}
                          </div>
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="px-6 pb-6 border-t border-border/30 pt-4">
                          <h4 className="text-sm font-medium text-foreground mb-2">
                            Feedback Message:
                          </h4>
                          <p className="text-sm text-foreground/70 whitespace-pre-wrap">
                            {feedbackMessage}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <>
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setShowCreateModal(false)}
            />
            <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
              <div
                className="bg-background/95 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-6 border-b border-border/50">
                  <h2 className="text-2xl font-bold text-foreground">
                    Create Notification
                  </h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-foreground/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-foreground/70" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={notificationForm.title}
                      onChange={(e) =>
                        setNotificationForm({
                          ...notificationForm,
                          title: e.target.value,
                        })
                      }
                      required
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter notification title"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Message *
                    </label>
                    <textarea
                      value={notificationForm.message}
                      onChange={(e) =>
                        setNotificationForm({
                          ...notificationForm,
                          message: e.target.value,
                        })
                      }
                      required
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      placeholder="Enter notification message"
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Type
                    </label>
                    <select
                      value={notificationForm.type}
                      onChange={(e) =>
                        setNotificationForm({
                          ...notificationForm,
                          type: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="info">Info</option>
                      <option value="success">Success</option>
                      <option value="warning">Warning</option>
                      <option value="error">Error</option>
                    </select>
                  </div>

                  {/* Link (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Link (Optional)
                    </label>
                    <input
                      type="text"
                      value={notificationForm.link}
                      onChange={(e) =>
                        setNotificationForm({
                          ...notificationForm,
                          link: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="/notes, /api, etc."
                    />
                  </div>

                  {/* Target Type */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Send To
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="all"
                          checked={notificationForm.targetType === "all"}
                          onChange={(e) =>
                            setNotificationForm({
                              ...notificationForm,
                              targetType: e.target.value,
                            })
                          }
                          className="w-4 h-4 text-purple-600"
                        />
                        <Users className="w-5 h-5 text-foreground/70" />
                        <span className="text-foreground">All Users</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="specific"
                          checked={notificationForm.targetType === "specific"}
                          onChange={(e) =>
                            setNotificationForm({
                              ...notificationForm,
                              targetType: e.target.value,
                            })
                          }
                          className="w-4 h-4 text-purple-600"
                        />
                        <User className="w-5 h-5 text-foreground/70" />
                        <span className="text-foreground">Specific Users</span>
                      </label>
                    </div>
                  </div>

                  {/* User Selection */}
                  {notificationForm.targetType === "specific" && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Select Users
                      </label>
                      <div className="max-h-60 overflow-y-auto border border-border rounded-xl p-4 space-y-2">
                        {users
                          .filter((u) => u.email !== session?.user?.email)
                          .map((user) => (
                            <label
                              key={user._id}
                              className="flex items-center gap-3 p-3 rounded-lg hover:bg-foreground/5 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={notificationForm.selectedUserIds.includes(
                                  user._id
                                )}
                                onChange={() => toggleUserSelection(user._id)}
                                className="w-4 h-4 text-purple-600 rounded"
                              />
                              <div className="flex-1">
                                <div className="text-foreground font-medium">
                                  {user.name}
                                </div>
                                <div className="text-foreground/60 text-sm">
                                  {user.email}
                                </div>
                              </div>
                            </label>
                          ))}
                      </div>
                      {notificationForm.selectedUserIds.length === 0 && (
                        <p className="text-sm text-foreground/60 mt-2">
                          Please select at least one user
                        </p>
                      )}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex items-center justify-end gap-4 pt-4 border-t border-border/50">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-6 py-3 rounded-xl border border-border text-foreground hover:bg-foreground/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={
                        sending ||
                        (notificationForm.targetType === "specific" &&
                          notificationForm.selectedUserIds.length === 0)
                      }
                      className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-xl",
                        "bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold",
                        "hover:from-purple-700 hover:to-purple-800 transition-all duration-200",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "shadow-lg hover:shadow-xl shadow-purple-500/30"
                      )}
                    >
                      {sending ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Send Notification
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
