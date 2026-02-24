import { useCallback, useEffect, useMemo, useState } from "react";
import { GroupMembersInterface, ToastInterface } from "../../utils/Interfaces";
import { isAxiosError } from "axios";
import {
  getGroupMembers,
  deleteGroupMember,
} from "../../services/groupsService.ts";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Card,
  Label,
  Select,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  TextInput,
  Tooltip,
} from "flowbite-react";
import { FaArrowLeft, FaUserTimes } from "react-icons/fa";
import { SiGooglemessages } from "react-icons/si";
import useAuth from "../../hooks/useAuth.ts";
import ToastMessage from "../common/ToastMessage.tsx";
import MessageToStudentModal from "../common/MessageToStudentModal.tsx";
import { HiOutlineSearch, HiUserAdd } from "react-icons/hi";
import { DeleteConfirmationDialogue } from "../common/DeleteConfirmationDialogue.tsx";
import CommonModal from "../common/CommonModal.tsx";
import AddGroupMember from "./reps/AddGroupMember.tsx";
import DetailsCard from "../common/DetailsCard.tsx";

const GroupMembers = () => {
  const [groupData, setGroupData] = useState<GroupMembersInterface>();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastInterface>({
    message: "",
    type: "error",
    isVisible: false,
  });
  const { user } = useAuth();
  const { groupId } = useParams();
  const navigate = useNavigate();
  const groupLeader = groupData?.Students.find(
    (student) => student?.GroupMember.isLeader,
  );
  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    studentId: "",
  });
  const [deleteAndModalState, setDeleteAndModalState] = useState({
    isDeleting: false,
    openDialogue: false,
    itemToDelete: "",
    studentIdToDelete: "",
    openAddModal: false,
  });
  const closeToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  const showToast = (message: string, type: "success" | "error") =>
    setToast({ message, type, isVisible: true });

  const fetchGroupData = useCallback(async (id: string) => {
    try {
      setLoading(true);

      const response = await getGroupMembers(id);
      if (response) setGroupData(response?.data);
    } catch (error) {
      if (isAxiosError(error)) {
        showToast(
          error.response?.data?.error || "Error fetching group members",
          "error",
        );
      } else {
        showToast("An unexpected error occurred.", "error");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = () => {
    if (groupId) {
      fetchGroupData(groupId).catch((err) => console.log(err));
    }
  };

  const filteredGroupMembers = useMemo(() => {
    if (!searchQuery) return groupData?.Students;
    const lowerQuery = searchQuery.toLowerCase();
    return groupData?.Students.filter((groupMember) =>
      Object.values(groupMember).some((value) =>
        String(value).toLowerCase().includes(lowerQuery),
      ),
    );
  }, [groupData?.Students, searchQuery]);

  useEffect(() => {
    if (groupId) {
      fetchGroupData(groupId).catch((err) => console.log(err));
    }
  }, []);

  const groupMembersTableHeaders = [
    "#",
    "Student ID",
    "Name",
    "Email",
    "Role",
    "Actions",
  ];

  const handleGroupMemberDelete = async () => {
    try {
      setDeleteAndModalState((prev) => ({ ...prev, isDeleting: true }));

      const response = await deleteGroupMember(
        deleteAndModalState?.studentIdToDelete ?? "",
      );

      if (response) showToast(response?.message, "success");
    } catch (error) {
      if (isAxiosError(error)) {
        showToast(
          error.response?.data?.error || "Error deleting group member",
          "error",
        );
      } else {
        showToast("An unexpected error occurred.", "error");
      }
    } finally {
      setDeleteAndModalState((prev) => ({
        ...prev,
        isDeleting: false,
        openDialogue: false,
      }));
      handleRefresh();
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      <Button
        color="alternative"
        className="w-50 cursor-pointer"
        onClick={() => navigate(-1)}
      >
        <FaArrowLeft className="me-2" />
        Back
      </Button>

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Group Members Management
      </h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <DetailsCard
          color="emerald"
          title="Number Group Members"
          value={groupData?.Students.length}
        />

        <DetailsCard
          color="pink"
          title="Group Details"
          value={
            <div className="flex flex-col items-start justify-start gap-3">
              <p>{groupData?.name || ""}</p>
              <small>{groupData?.description || ""}</small>
              <small>{groupData?.Course?.name || "General Group"}</small>
            </div>
          }
        />

        <DetailsCard
          color="blue"
          title="Group Lead"
          value={
            <div className="flex flex-col items-start justify-start gap-3">
              <p className="text-4xl font-extrabold text-blue-600">
                {groupLeader?.name || "No leader assigned"}
              </p>
              {groupLeader && user?.isRep && (
                <Tooltip content="send message to group leader">
                  <span
                    className="cursor-pointer"
                    onClick={() =>
                      setMessageModal({
                        isOpen: true,
                        studentId: groupLeader?.id ?? "",
                      })
                    }
                  >
                    <SiGooglemessages size={32} color="blue" />{" "}
                  </span>
                </Tooltip>
              )}
            </div>
          }
        />
      </div>

      {user?.isRep && (
        <Button
          className="w-sm cursor-pointer"
          onClick={() =>
            setDeleteAndModalState((prev) => ({ ...prev, openAddModal: true }))
          }
        >
          <HiUserAdd size={24} className="me-2" />
          Add new Member
        </Button>
      )}

      <Card>
        <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-12">
          <div className="md:col-span-2">
            <Label htmlFor="entries" className="mb-2 block font-medium">
              Show
            </Label>
            <Select
              id="entries"
              className="rounded border-none text-gray-900 dark:text-white"
              // value={pagination.itemsPerPage}
              // onChange={(e) =>
              //   setPagination((prev) => ({
              //     ...prev,
              //     itemsPerPage: Number.parseInt(e.target.value),
              //     currentPage: 1,
              //   }))
              // }
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              {/* <option value={pagination?.totalItems}>All</option> */}
            </Select>
          </div>

          <div className="md:col-span-5">
            <Label htmlFor="search" className="mb-2 block font-medium">
              Search Members
            </Label>
            <TextInput
              id="search"
              placeholder="Search Members..."
              icon={HiOutlineSearch}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Group Members
      </h1>

      <div className="overflow-x-auto rounded-lg shadow-md">
        <Table striped>
          <TableHead>
            <TableRow>
              {groupMembersTableHeaders.map((head, idx) => (
                <TableHeadCell key={idx}>{head}</TableHeadCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={groupMembersTableHeaders.length}>
                  <Spinner size="lg" />
                </TableCell>
              </TableRow>
            ) : (filteredGroupMembers?.length ?? 0) > 0 ? (
              filteredGroupMembers!.map((member, idx) => (
                <TableRow key={idx}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{member?.id || ""}</TableCell>
                  <TableCell>{member?.name || ""}</TableCell>
                  <TableCell>{member?.email || ""}</TableCell>
                  <TableCell>
                    {member?.GroupMember?.isLeader ? "Leader" : "Member"}
                  </TableCell>
                  <Tooltip content="Remove student from group">
                    {user?.isRep && (
                      <TableCell>
                        <FaUserTimes
                          size={24}
                          color="red"
                          className="cursor-pointer"
                          onClick={() =>
                            setDeleteAndModalState((prev) => ({
                              ...prev,
                              openDialogue: true,
                              studentIdToDelete: member?.id,
                              itemToDelete: member?.name,
                            }))
                          }
                        />
                      </TableCell>
                    )}
                  </Tooltip>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={groupMembersTableHeaders.length}>
                  No group member found for this group
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {toast.isVisible && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}

      <MessageToStudentModal
        isOpen={messageModal.isOpen}
        studentId={messageModal.studentId}
        onClose={() => setMessageModal((prev) => ({ ...prev, isOpen: false }))}
      />

      <DeleteConfirmationDialogue
        isOpen={deleteAndModalState?.openDialogue}
        isDeleting={deleteAndModalState?.isDeleting}
        itemToDelete={deleteAndModalState?.itemToDelete}
        handleDelete={handleGroupMemberDelete}
        onClose={() =>
          setDeleteAndModalState((prev) => ({ ...prev, openDialogue: false }))
        }
      />

      <CommonModal
        open={deleteAndModalState?.openAddModal}
        onClose={() =>
          setDeleteAndModalState((prev) => ({ ...prev, openAddModal: false }))
        }
      >
        {
          <AddGroupMember
            groupId={groupId ?? ""}
            onSuccess={(message?: string) => {
              if (message) showToast(message, "success");
              setDeleteAndModalState((prev) => ({
                ...prev,
                openAddModal: false,
              }));
            }}
          />
        }
      </CommonModal>
    </div>
  );
};

export default GroupMembers;
