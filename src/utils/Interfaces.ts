import React from "react";

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
  type: "error" | "success";
  onClose: () => void;
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
  studentData?: {
    Groups: groupType[];
  } | null;
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
    Groups: groupType[];
  } | null;
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

export interface NewGroupMemberInterface {
  studentId: string;
  groupId: string;
}

export interface NewGroupMemberProp {
  onSuccess: (message: string) => void;
  groupId: string;
}

export interface ViewFeedbackProps {
  formData: Feedback;
  setCurrentStudentId: (id: string) => void;
  setModalState: (modalState: any) => void;
}

export interface CourseModalContentInterface {
  modalState: ModalState;
  setModalState: (modalState: any) => void;
  handleCourseSubmit: (
    e: React.FormEvent<HTMLFormElement>,
  ) => void | Promise<void>;
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  formData: CourseInterface;
  setFormData: React.Dispatch<React.SetStateAction<CourseInterface>>;
  lecturers: Lecturer[];
  setEditId: (id: string | null) => void;
}

export interface SlideUploadInterface {
  folderId: string;
  courseId: string;
  files: File[];
}

export interface SlideInterface {
  id: string;
  driveFileID: string;
  fileName: string;
  courseId: string;
  createdAt: string;
}

export interface AssignmentCreationInterface {
  title: string;
  description: string;
  courseId: string;
  deadline: string;
  file?: File;
}

export interface AssignmentsInterface extends AssignmentCreationInterface {
  id: string;
  submissionFolderID: string;
  fileId: string;
  fileName: string;
}

export interface AssignmentSubmissionInterface {
  folderId: string;
  assignmentId: string;
  studentId: string;
  file?: File;
}

export interface SubmittedAssignment {
  id: string;
  assignmentId: string;
  studentId: string;
  title: string;
  deadline: string;
  fileId: string;
  fileName: string;
  submittedAt: string;
  Assignment: {
    id: string;
    title: string;
    description: string;
    deadline: string;
    courseId: string;
    Course: {
      name: string;
    };
  };
  Course: {
    name: string;
  };
}

export interface AssignmentDetailsInterface extends SubmittedAssignment {
  id: string;
  assignmentId: string;
  studentId: string;
  fileId: string;
  fileName: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  Student: {
    id: string;
    name: string;
    email: string;
  };
}
