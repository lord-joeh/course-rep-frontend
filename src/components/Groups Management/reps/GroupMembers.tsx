import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  GroupMembersInterface,
  ToastInterface,
} from "../../../utils/Interfaces";
import { isAxiosError } from "axios";
import { getGroupMembers } from "../../../services/groupsService";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, Tooltip } from "flowbite-react";
import { MdRefresh } from "react-icons/md";
import { FaArrowLeft } from "react-icons/fa";
import { SiGooglemessages } from "react-icons/si";

const GroupMembers = () => {
  const [groupData, setGroupData] = useState<GroupMembersInterface>();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastInterface>({
    message: "",
    type: "error",
    isVisible: false,
  });
  const { groupId } = useParams();
  const navigate = useNavigate();
  const groupLeader = groupData?.Students.find(
    (student) => student?.GroupMember.isLeader,
  );

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
      fetchGroupData(groupId);
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
      fetchGroupData(groupId);
    }
  }, []);

  return (
    <div className="flex flex-col gap-6 p-6 font-sans md:p-1">
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

      <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
        <input
          id="search"
          type="search"
          placeholder="Search group members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-[90%] flex-grow rounded-lg border px-4 py-2 focus:outline-none md:w-auto"
        />
        <Button onClick={handleRefresh} className="w-50">
          <MdRefresh className="me-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
        <Card className="border-l-4 border-l-emerald-500">
          <h5 className="text-xl font-bold">Number Group Members</h5>
          <p className="text-4xl font-extrabold text-emerald-500">
            {groupData?.Students.length}
          </p>
        </Card>
        <Card className="border-l-4 border-l-red-600">
          <h5 className="text-xl font-bold">Group Details</h5>
          <p className="text-4xl font-extrabold text-red-600">
            {groupData?.name}
          </p>
          <small>{groupData?.description}</small>
          <small>{groupData?.Course.name}</small>
        </Card>
        <Card className="border-l-4 border-l-blue-600">
          <h5 className="text-xl font-bold">Group Leader</h5>
          <p className="text-4xl font-extrabold text-blue-600">
            {groupLeader?.name || "No leader assigned"}
          </p>
          <Tooltip content="send message to group leader">
            <span className="cursor-pointer">
              <SiGooglemessages size={32} color="blue" />{" "}
            </span>
          </Tooltip>
        </Card>
      </div>
    </div>
  );
};

export default GroupMembers;
