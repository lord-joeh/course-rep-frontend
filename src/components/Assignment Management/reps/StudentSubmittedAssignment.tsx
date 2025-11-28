import { Button, Card, Pagination, Spinner, Tooltip } from "flowbite-react"
import { useEffect, useState } from "react"
import { MdDeleteForever, MdRefresh } from "react-icons/md"
import { PaginationType, SubmittedAssignment, ModalState } from "../../../utils/Interfaces"
import { useSearch } from "../../../hooks/useSearch"
import { deleteSubmittedAssignment, getStudentSubmittedAssignment } from "../../../services/assignmentService"
import { useCrud } from "../../../hooks/useCrud"
import ToastMessage from "../../common/ToastMessage"
import { isAxiosError } from "axios"
import useAuth from "../../../hooks/useAuth"
import { FaArrowLeft, FaRegCalendarCheck } from "react-icons/fa"
import { useNavigate } from "react-router-dom"
import { FaRegCalendarXmark } from "react-icons/fa6"
import { FiDownload } from "react-icons/fi"
import { downloadSlide as downloadSubmittedAssignment } from "../../../services/slidesServices"
import { DeleteConfirmationDialogue } from "../../common/DeleteConfirmationDialogue"


const StudentSubmittedAssignment = () => {
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [submissions, setSubmissions] = useState<SubmittedAssignment[]>([])
    const [submissionToDelete, setSubmissionToDelete] = useState<SubmittedAssignment>()
    const [loading, setLoading] = useState(false)
    const filteredSubmissions = useSearch<SubmittedAssignment>(submissions, searchQuery)
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
    const { user } = useAuth()
    const navigate = useNavigate()

    const crudServices = {
        list: async () => ({ data: [] as SubmittedAssignment[] }),
        download: downloadSubmittedAssignment,
    }

    const {
        toast,
        showToast,
        closeToast,
        download,
    } = useCrud<SubmittedAssignment>(crudServices)

    const fetchSubmissions = async () => {
        if (!user?.data?.id) return showToast("Student ID missing", "error")
        setLoading(true)
        try {
            const response = await getStudentSubmittedAssignment(user?.data?.id, pagination?.currentPage, pagination?.itemsPerPage)
            setSubmissions(response?.data?.submissions)
            setPagination(response?.data?.pagination)
        } catch (error) {
            if (isAxiosError(error)) {
                showToast(error?.response?.data?.message || "Failed fetching submissions", "error")
            } else {
                showToast("Failed fetching submissions", "error")
            }
        } finally {
            setLoading(false)
        }
    }

    const onPageChange = (page: number) => setPagination((prev) => ({ ...prev, currentPage: page }))

    const handleFileDownload = async (fileId: string) => {
        if (!fileId) return showToast("Not a file", "error");
        try {
            await download(fileId);

        } catch (error) {
        }
    };

    const handleFileDelete = async (submission: SubmittedAssignment | undefined) => {
        setModalState((prev) => ({ ...prev, isDeleting: true }))
        if (!submission?.id) return showToast("Submission ID missing", "error");
        try {
            const response = await deleteSubmittedAssignment(submission);
            showToast(response?.message || "Submission deleted successfully", "success");
        } catch (error) {
            if (isAxiosError(error)) {
                showToast(error?.response?.data?.message || "Failed deleting submission", "error")
            } else {
                showToast("Failed deleting submission", "error")
            }
        } finally {
            setModalState((prev) => ({ ...prev, isDeleting: false, isDeleteDialogueOpen: false }))
            fetchSubmissions()
        }
    };

    useEffect(() => {
        fetchSubmissions()
    }, [pagination?.currentPage, pagination?.itemsPerPage])


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

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Submitted Assignments</h1>

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
                >
                    <MdRefresh size={18} className="me-1" /> Refresh
                </Button>
            </div>

            {
                loading ? (<Spinner size="lg" className="mr-4" />) : (filteredSubmissions?.length ?? 0) > 0 ? (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {
                            filteredSubmissions.map((submission, idx) => (
                                <Card key={idx} >

                                    <div className="flex flex-col gap-3 flex-wrap">
                                        <h5 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{submission?.fileName ?? "Untitled"}</h5>
                                        <span className="flex gap-3">
                                            <FaRegCalendarCheck size={24} color="green" />
                                            <p className="text-lg font-light">{submission?.submittedAt ? new Date(submission?.submittedAt).toDateString() : ""} </p>
                                        </span>

                                        <span className="flex gap-3">
                                            <FaRegCalendarXmark size={24} color="red" />
                                            <p className="text-lg font-light">{submission?.Assignment?.deadline ? new Date(submission?.Assignment?.deadline).toDateString() : ""} </p>
                                        </span>

                                        <span className="flex gap-3 flex-col text-lg">
                                            <small>{submission?.Assignment?.Course?.name} </small>
                                            <small>{submission?.Assignment?.title} </small>
                                        </span>
                                    </div>

                                    <div className="flex justify-between ">

                                        <Tooltip content="Download">
                                            <FiDownload size={30} className="me-2 cursor-pointer"
                                                onClick={() => handleFileDownload(submission?.fileId)} />
                                        </Tooltip>

                                        <Tooltip content="Delete">
                                            <MdDeleteForever size={30} color="red" className="me-2 cursor-pointer"
                                                onClick={() => {
                                                    setSubmissionToDelete(submission);
                                                    setModalState((prev) => ({ ...prev, itemToDelete: submission?.fileName, idToDelete: submission?.id, isDeleteDialogueOpen: true }))
                                                }} />
                                        </Tooltip>
                                    </div>





                                </Card>
                            ))
                        }
                    </div>
                ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400">
                        No Assignment Submitted
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

            {
                toast.visible && (
                    <ToastMessage message={toast?.message} type={toast?.type} onClose={closeToast} />
                )
            }

            {
                <DeleteConfirmationDialogue
                    isDeleting={modalState?.isDeleting} isOpen={modalState?.isDeleteDialogueOpen}
                    itemToDelete={submissionToDelete?.fileName ?? ""} onClose={() => setModalState((prev) => ({ ...prev, isDeleteDialogueOpen: false }))}
                    handleDelete={() => handleFileDelete(submissionToDelete)} />
            }
        </div>
    )
}

export default StudentSubmittedAssignment