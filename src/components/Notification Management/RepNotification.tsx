import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "flowbite-react";
import { HiPlus, HiPencil, HiTrash } from "react-icons/hi";
import {
  getNotifications,
  addNotification,
  updateNotification,
  deleteNotification,
  Notification,
} from "../../services/notificationServices";
import NotificationModal from "../../components/Notification Management/NotificationModal";
import { DeleteConfirmationDialogue } from "../../components/common/DeleteConfirmationDialogue";
import ToastMessage from "../../components/common/ToastMessage";
import { format } from "date-fns";

const RepNotification = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 5,
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success " as "success" | "error",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Notification | undefined>(
    undefined,
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const onPageChange = (pageNumber: number) => {
    setPagination((prev) => ({ ...prev, currentPage: pageNumber }));
  };

  const fetchNotifications = async (page = 1) => {
    setLoading(true);
    try {
      const res = await getNotifications(page, pagination.itemsPerPage);
      setNotifications(res.data.notifications);
      setPagination(res.data.pagination);
    } catch (err) {
      setToast({
        visible: true,
        message: "Failed to fetch notifications",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(pagination.currentPage);
  }, [pagination.currentPage]);

  const handleCreate = async (data: { title: string; message: string }) => {
    setLoading(true);
    try {
      await addNotification(data);
      setToast({
        visible: true,
        message: "Notification created",
        type: "success",
      });
      setIsModalOpen(false);
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      fetchNotifications(1);
    } catch {
      setToast({
        visible: true,
        message: "Failed to create notification",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data: { title: string; message: string }) => {
    if (editingItem) {
      setLoading(true);
      try {
        await updateNotification(editingItem.id, data);
        setToast({
          visible: true,
          message: "Notification updated",
          type: "success",
        });
        setEditingItem(undefined);
        setIsModalOpen(false);
        fetchNotifications(pagination.currentPage);
      } catch {
        setToast({
          visible: true,
          message: "Failed to update notification",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      setLoading(true);
      try {
        await deleteNotification(deleteId);
        setToast({
          visible: true,
          message: "Notification deleted",
          type: "success",
        });
        setDeleteId(null);
        fetchNotifications(pagination.currentPage);
      } catch {
        setToast({
          visible: true,
          message: "Failed to delete notification",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const openEdit = (item: Notification) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const closeToast = () => setToast((prev) => ({ ...prev, visible: false }));

  return (
    <div className="container mx-auto space-y-6 p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
            Announcements
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Manage system-wide notifications for all students.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(undefined);
            setIsModalOpen(true);
          }}
        >
          <HiPlus className="mr-2 h-5 w-5" />
          Post Announcement
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table hoverable>
            <TableHead>
              <TableRow>
                <TableHeadCell>Title</TableHeadCell>
                <TableHeadCell>Message</TableHeadCell>
                <TableHeadCell>Date Posted</TableHeadCell>
                <TableHeadCell>Actions</TableHeadCell>
              </TableRow>
            </TableHead>

            <TableBody className="divide-y">
              {notifications.length > 0 ? (
                notifications.map((note) => (
                  <TableRow
                    key={note.id}
                    className="bg-white dark:border-gray-700 dark:bg-gray-800"
                  >
                    <TableCell className="font-medium whitespace-nowrap text-gray-900 dark:text-white">
                      {note.title}
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {note.message}
                    </TableCell>
                    <TableCell>
                      {note.createdAt &&
                        format(new Date(note.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="xs"
                          color="green"
                          onClick={() => openEdit(note)}
                        >
                          <HiPencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="xs"
                          color="red"
                          onClick={() => setDeleteId(note.id)}
                        >
                          <HiTrash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-gray-500"
                  >
                    No announcements posted yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="m-2 flex place-self-center sm:justify-center">
        <Pagination
          layout="table"
          currentPage={pagination?.currentPage || 1}
          itemsPerPage={pagination?.itemsPerPage || 10}
          totalItems={pagination?.totalItems || 0}
          onPageChange={onPageChange}
          showIcons
        />
      </div>

      {/* Create/Edit Modal */}
      <NotificationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={editingItem ? handleUpdate : handleCreate}
        initialData={editingItem}
        isSubmitting={loading}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmationDialogue
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        handleDelete={handleDelete}
        itemToDelete="this announcement"
        isDeleting={loading}
      />

      {/* Feedback Toast */}
      {toast.visible && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}
    </div>
  );
};
export default RepNotification;
