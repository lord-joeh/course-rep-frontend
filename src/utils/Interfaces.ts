export interface CourseInterface {
  id: string;
  name: string;
  lecturerId: string;
  day: string;
  start_time: string;
  end_time: string;
  semester: string;
  slidesFolderID: string;
  createdAt: string;
}

export interface ModalState {
  isAdding: boolean;
  isDeleteDialogueOpen: boolean;
  isModalOpen: boolean;
  isDeleting: boolean;
  isEditing: boolean;
  itemToDelete: string;
  idToDelete: string;
}

export interface ToastInterface {
  message: string;
  type: "error" | "success";
  isVisible: boolean;
}

export interface Lecturer {
  id: string;
  name: string;
}

export interface CourseStudentData {
  courseId: string;
  studentId: string;
}

export interface ModalInterface {
  open: boolean;
  children: React.ReactNode;
  onClose: () => void;
}

export interface DeleteType {
  isDeleting: boolean;
  isOpen: boolean;
  handleDelete: () => void;
  itemToDelete: string;
  onClose: () => void;
}

export interface MessageProp {
  isOpen: boolean;
  studentId: string;
  onClose: () => void;
}

export interface MessageInterface {
  message: string;
  messageType: "SMS" | "email";
}

export interface ToastType {
  message: string;
  type: string;
  onClose: () => void | null;
}

export interface Event {
  id: string;
  description: string;
  date: string;
  time: string;
  venue: string;
}

export interface PaginationType {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
}

export interface Feedback {
  id: string;
  studentId: string;
  content: string;
  is_anonymous: boolean;
  Student: { name: string };
}

export interface FeedbackStudent {
  studentId: string;
  content: string;
  is_anonymous: boolean;
}

export interface AddNewGroupProps {
  courses?: Course[];
  onSuccess?: (message?: string) => void;
}

export interface GroupInterface {
  id: string;
  name: string;
  courseId: string;
  isGeneral: boolean;
  description: string;
  Course: { name: string };
}

export interface Course {
  id: string;
  name: string;
}

export interface MagicInterface {
  courseId: string;
  studentsPerGroup: number;
  isGeneral: boolean;
}

export type navbarProp = {
  toggleSidebar: () => void;
  brandName?: string;
};

export type SidebarProps = {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
};

export interface Lecturer {
  id: string;
  name: string;
  phone: string;
  email: string;
  Courses: [];
}

export type courseType = { name: string };

export type groupType = {
  id: string;
  name: string;
  Course: {
    name: string;
  };
  GroupMember: {
    isLeader: boolean;
  };
};

export type StudentGroupsProps = {
  studentData: {
    Groups: groupType[];
  };
  isLoading: boolean;
  error: string | null;
};

export type studentDataHook = {
  error: string | null;
  isLoading: boolean;
  studentData: {
    name: string;
    phone: string;
    email: string;
    id: string;
    status: string;
    isRep: boolean;
    Groups: any[];
  };
};

export interface Student {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: "active";
}

export interface GroupEditInterface {
  coursesList: Course[];
  closeEditModal: () => void;
  selectedGroup: Partial<GroupInterface>;
  onSuccess: (message: string) => void;
}

export interface MagicGroupsProp {
  coursesList: Course[];
  onSuccess: (message: string) => void;
}

export interface GroupMembersInterface extends GroupInterface {
  Course: Course;
  Students: {
    id: string;
    name: string;
    email: string;
    GroupMember: {
      isLeader: boolean;
    };
  }[];
}

export interface GroupMemberProp {
  groupId: string;
}

export interface NewGroupMemberInterface {
  studentId: string;
  groupId: string;
}

export interface NewGroupMemberProp {
  onSuccess: (message: string) => void;
  groupId: string;
}
