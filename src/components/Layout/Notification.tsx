import { useState, useEffect } from "react";
import { HiBell, HiClock, HiCheck } from "react-icons/hi";
import { Dropdown, Spinner, Button } from "flowbite-react";
import { useSocket } from "../../hooks/useSocket";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  Notification,
} from "../../services/notificationServices";
import { format } from "date-fns";

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const socket = useSocket();

  const fetchNotifications = async (pageNum: number, isRefresh = false) => {
    try {
      setLoading(true);
      const res = await getNotifications(pageNum, 5);
      const newNotes = res?.data.notifications || [];
      const total = res?.data.pagination?.totalItems || 0;

      if (isRefresh) {
        setNotifications(newNotes);
      } else {
        setNotifications((prev) => [...prev, ...newNotes]);
      }

      if (isRefresh) {
        const unread = newNotes.filter((n: Notification) => !n.isRead).length;
        setUnreadCount(unread);
      }

      setHasMore(notifications.length + newNotes.length < total);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1, true);
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleNew = (note: Notification) => {
      const newNote = { ...note, isRead: false };
      setNotifications((prev) => [newNote, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };
    socket.on("newNotification", handleNew);
    return () => {
      socket.off("newNotification", handleNew);
    };
  }, [socket]);

  const handleMarkRead = async (note: Notification) => {
    if (note.isRead) return;
    try {
      await markAsRead(note.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage);
  };

  return (
    <Dropdown
      arrowIcon={false}
      inline
      label={
        <div className="relative cursor-pointer transition-colors hover:text-blue-600 dark:hover:text-blue-500">
          <HiBell size={28} className="text-gray-500 dark:text-gray-400" />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 flex h-5 w-5 animate-pulse items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white shadow-md">
              {unreadCount > 9 ? "9+" : unreadCount}
            </div>
          )}
        </div>
      }
    >
      <div className="w-80 sm:w-96">
        <div className="flex items-center justify-between border-b px-4 py-3 dark:border-gray-600">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            Notifications
          </span>
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-blue-600 hover:underline dark:text-blue-500"
          >
            Mark all read
          </button>
        </div>

        <ul className="max-h-80 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-700">
          {notifications.length > 0 ? (
            notifications.map((note) => (
              <li
                key={note.id}
                onClick={() => handleMarkRead(note)}
                className={`group cursor-pointer px-4 py-3 transition-colors ${
                  note.isRead
                    ? "opacity-60 hover:bg-gray-50 dark:hover:bg-gray-700"
                    : "bg-blue-50 hover:bg-blue-100 dark:bg-gray-700 dark:hover:bg-gray-600"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p
                        className={`text-sm font-medium ${note.isRead ? "text-gray-700 dark:text-gray-300" : "text-gray-900 dark:text-white"}`}
                      >
                        {note.title}
                      </p>
                      {!note.isRead && (
                        <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                      {note.message}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center text-xs text-gray-400 dark:text-gray-500">
                        <HiClock className="mr-1" />
                        {note.createdAt
                          ? format(new Date(note.createdAt), "MMM d, h:mm a")
                          : "Just now"}
                      </div>
                      {note.isRead && <HiCheck className="text-green-500" />}
                    </div>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="px-4 py-6 text-center text-sm text-gray-500">
              No notifications yet
            </li>
          )}

          {/* Load More Area */}
          {hasMore && (
            <li className="p-2 text-center">
              <Button
                size="xs"
                color="gray"
                fullSized
                onClick={(e) => {
                  e.stopPropagation();
                  loadMore();
                }}
                disabled={loading}
              >
                {loading ? <Spinner size="sm" /> : "Load More"}
              </Button>
            </li>
          )}
        </ul>
      </div>
    </Dropdown>
  );
};

export default Notifications;
