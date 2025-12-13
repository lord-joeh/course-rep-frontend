import { Button, Card, Label, Pagination, Select, Spinner, Tooltip } from "flowbite-react"
import { useEffect, useState } from "react";
import { FaArrowLeft, FaEdit, FaRegCalendarCheck } from "react-icons/fa"
import { MdDeleteForever, MdRefresh } from "react-icons/md"
import { useNavigate, useParams } from "react-router-dom";
import { AssignmentDetailsInterface, SubmittedAssignment, type ModalState, type PaginationType } from "../../../utils/Interfaces";
import { useSearch } from "../../../hooks/useSearch";
import { TbCalendarDue } from "react-icons/tb";
import { useCrud } from "../../../hooks/useCrud";
import { deleteAssignmentById, getAssignmentDetailsById } from "../../../services/assignmentService";
import { isAxiosError } from "axios";
import useAuth from "../../../hooks/useAuth";
import ToastMessage from "../../common/ToastMessage";
import { DeleteConfirmationDialogue } from "../../common/DeleteConfirmationDialogue";
import CommonModal from "../../common/CommonModal";
import AddNewAssignment from "./AddNewAssignment";


const AssignmentDetails = () => {
    const [searchQuery, setSearchQuery] = useState<string>("");
    const navigate = useNavigate()
    const [assignmentInfo, setAssignmentInfo] = useState<SubmittedAssignment>()
    const [submissions, setSubmissions] = useState<AssignmentDetailsInterface[]>([])
    const filteredSubmissions = useSearch<AssignmentDetailsInterface>(submissions, searchQuery)
    const [loading, setLoading] = useState(false)
    const [pagination, setPagination] = useState<PaginationType>({
        itemsPerPage: 12,
        totalItems: 0,
        currentPage: 1,
        totalPages: 0
    })
    const [modalState, setModalState] = useState<ModalState>({
        isAdding: false,
        isEditing: false,
        isDeleting: false,
        isDeleteDialogueOpen: false,
        isModalOpen: false,
        idToDelete: "",
        itemToDelete: ""
    })
    const params = useParams()
    const assignmentId = params?.assignmentId
    const { user } = useAuth()

    const crudServices = {
        list: async () => ({ data: [] as AssignmentDetailsInterface[] }),
        remove: deleteAssignmentById
    }

    const {
        showToast,
        closeToast,
        toast,
        remove
    } = useCrud<AssignmentDetailsInterface>(crudServices)

    const fetchAssignmentSubmissions = async () => {
        if (!assignmentId) return showToast("Assignment ID not provided", "error")
        setLoading(true)
        try {
            const response = await getAssignmentDetailsById(assignmentId, pagination?.currentPage, pagination?.itemsPerPage)
            setAssignmentInfo(response?.data?.assignment)
            setSubmissions(response?.data?.submissions.submissions)
            setPagination(response?.data?.submissions?.pagination)

        } catch (error) {
            if (isAxiosError(error)) {
                showToast(error?.response?.data?.message, "error")
            } else {
                showToast("Error fetching data", "error")
            }

        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!assignmentId) return showToast("Assignment ID not provided", "error")
        setModalState((prev) => ({ ...prev, isDeleting: true }))
        try {
            await remove(assignmentId)
        } catch (error) { } finally {
            setModalState((prev) => ({ ...prev, isDeleting: false, isDeleteDialogueOpen: false }))
        }
    }

    const handleRefresh = () => {
        fetchAssignmentSubmissions()
    }

    useEffect(() => {
        fetchAssignmentSubmissions()

    }, [pagination?.currentPage, pagination?.itemsPerPage])

    const onPageChange = (pageNumber: number) => {
        setPagination((prev) => ({ ...prev, currentPage: pageNumber }));
    };





    return (
        <div className="flex flex-col gap-5 dark:text-white">
            <Button
                color="alternative"
                className="w-50 cursor-pointer"
                onClick={() => navigate(-1)}
            >
                <FaArrowLeft className="me-2" />
                Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Assignment Details</h1>

            <div className="flex w-full items-center gap-3">
                <div className="flex min-w-0 flex-1">
                    <input
                        id="search"
                        type="search"
                        placeholder="Search Submissions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Search Submissions"
                        className="w-full min-w-0 rounded-lg border px-4 py-2 focus:outline-none"
                    />
                </div>

                <Button
                    className="shrink-0 flex items-center gap-2 px-3 py-2"
                    aria-label="Refresh Submitted Assignments"
                    onClick={handleRefresh}
                >
                    <MdRefresh size={18} className="me-1" /> Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-l-4 border-l-emerald-500">
                    <h5 className="text-xl font-bold">Number of Submitted Assignments</h5>
                    <p className="text-4xl font-extrabold text-emerald-500">
                        {pagination?.totalItems || 0}
                    </p>
                </Card>
                <Card className="border-l-4 border-l-blue-600">
                    <h5 className="text-xl font-bold">Assignment Details</h5>
                    <p className="text-3xl font-extrabold text-blue-600">
                        {assignmentInfo?.title || ""}
                    </p>
                    <small>{assignmentInfo?.Course?.name || ""}</small>
                    <span className="flex gap-3">
                        <TbCalendarDue size={24} color="red" />
                        <p className="text-lg font-semibold">{assignmentInfo?.deadline ? new Date(assignmentInfo?.deadline).toDateString() : ""} </p>
                    </span>
                </Card>

                {user && user?.isRep && (
                    <Card className="border-l-4 border-l-red-600">
                        <h5 className="text-xl font-bold ">Assignment Actions</h5>

                        <Tooltip content="Update Assignment Info">
                            <span
                                className="cursor-pointer"
                                onClick={() => setModalState((prev) => ({ ...prev, isModalOpen: true, isEditing: true }))}
                            >
                                <FaEdit size={30} color="green" />{" "}
                            </span>
                        </Tooltip>

                        <Tooltip content="Delete Assignment and all Data">
                            <span
                                className="cursor-pointer"
                                onClick={() => setModalState((prev) => ({ ...prev, itemToDelete: assignmentInfo?.title ?? "", idToDelete: assignmentInfo?.id ?? "", isDeleteDialogueOpen: true }))}
                            >
                                <MdDeleteForever size={30} color="red" />{" "}
                            </span>
                        </Tooltip>
                    </Card>
                )}
            </div>
            <div className="flex items-center gap-2">
                <Label htmlFor="entries">Show</Label>
                <Select
                    id="entries"
                    className="rounded border-none text-gray-900 dark:text-white"
                    value={pagination.itemsPerPage}
                    onChange={(e) =>
                        setPagination((prev) => ({
                            ...prev,
                            itemsPerPage: parseInt(e.target.value),
                            currentPage: 1,
                        }))
                    }
                >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={pagination?.totalItems}>All</option>
                </Select>
                Entries
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Submissions</h1>

            {
                loading ? (<Spinner size="lg" />) : (filteredSubmissions.length ?? 0) > 0 ? (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {
                            filteredSubmissions.map((submitted, idx) => (
                                <Card key={idx}>
                                    <div className="flex flex-col gap-3 flex-wrap">
                                        <h5 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">{submitted?.fileName ?? "Untitled"}</h5>
                                        <p className="text-lg font-light">{submitted?.Student?.name || ""} </p>
                                        <small>{submitted?.Student?.id || ""}</small>
                                        <small>{submitted?.Student?.email || ""}</small>
                                        <span className="flex gap-3">
                                            <FaRegCalendarCheck size={24} color="green" />
                                            <p className="text-lg font-light">{submitted?.submittedAt ? new Date(submitted?.submittedAt).toDateString() : ""} </p>
                                        </span>

                                    </div>
                                </Card>
                            ))
                        }

                    </div>
                ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400">
                        No Assignment Submitted.
                    </div>
                )
            }



            {
                filteredSubmissions.length > 0 && (
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
                )
            }

            {toast.visible && (
                <ToastMessage
                    message={toast.message}
                    type={toast.type}
                    onClose={closeToast}
                />
            )}

            {
                <CommonModal open={modalState?.isModalOpen} onClose={() => setModalState((prev) => ({ ...prev, isModalOpen: false }))} >
                    <AddNewAssignment
                        assignment={assignmentInfo as any}
                        isEditing={modalState?.isEditing || true}
                        onClose={() => setModalState((prev) => ({ ...prev, isModalOpen: false }))}
                    />
                </CommonModal>
            }

            {
                <DeleteConfirmationDialogue
                    isOpen={modalState?.isDeleteDialogueOpen}
                    itemToDelete={modalState?.itemToDelete}
                    isDeleting={modalState?.isDeleting}
                    handleDelete={handleDelete}
                    onClose={() => setModalState((prev) => ({ ...prev, isDeleteDialogueOpen: false }))} />
            }
        </div>
    )
}

export default AssignmentDetails