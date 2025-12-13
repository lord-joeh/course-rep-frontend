import { FileInput, Label, HelperText, Button, Spinner, Progress } from "flowbite-react"
import { IoCloudUploadOutline } from "react-icons/io5"
import { submitAssignment } from "../../../services/assignmentService"
import { useCrud } from "../../../hooks/useCrud"
import { useSocket } from "../../../hooks/useSocket"
import { AssignmentSubmissionInterface } from "../../../utils/Interfaces"
import { ChangeEvent, useState, useEffect } from "react"
import ToastMessage from "../../common/ToastMessage"


const SubmitAssignment = ({ folderId, assignmentId, studentId }: AssignmentSubmissionInterface) => {
    const formData = new FormData
    const crudServices = {
        list: async () => ({ data: [] as AssignmentSubmissionInterface[] }),
        add: submitAssignment
    }

    const {
        loading,
        add,
        toast,
        closeToast
    } = useCrud<AssignmentSubmissionInterface>(crudServices)

    const socket = useSocket();
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("");

    useEffect(() => {
        if (!socket) return;

        const onProgress = (data: any) => {
            // Check if this event belongs to us? 
            // In a real app we might correlate job IDs. 
            // For now rely on socketId isolation (one client usually does one thing).
            if (data.status === "start") {
                setProcessing(true);
                setProgress(0);
                setStatusText("Starting submission...");
            } else if (data.status === "progress") {
                setProgress(Math.round((data.current / data.total) * 100));
                setStatusText("Uploading file...");
            }
        };

        const onComplete = () => {
            setProcessing(false);
            setProgress(100);
            setStatusText("Submission complete!");
            // Toast handled by global listener or we can show here too?
            // Global listener handles jobCompleted.
        };

        socket.on("uploadProgress", onProgress);
        socket.on("uploadComplete", onComplete);

        return () => {
            socket.off("uploadProgress", onProgress);
            socket.off("uploadComplete", onComplete);
        };
    }, [socket]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            formData.append("file", e.target.files[0])
            formData.append("folderId", folderId)
            formData.append("assignmentId", assignmentId)
            formData.append("assignmentId", assignmentId)
            formData.append("studentId", studentId)
            if (socket && socket.id) formData.append("socketId", socket.id);
        }
        console.log(e.target.files)
    }

    const handleSubmit = async (e: ChangeEvent<HTMLFormElement>) => {
        e.preventDefault()
        try {
            await add(formData)
            setProcessing(true);
            setStatusText("Queued...");
        } catch (error) { }
    }

    return (
        <div className="container flex flex-col justify-center gap-5 dark:text-white">
            <h1 className="text-3xl">Submit Assignment</h1>
            <form encType="multipart/form-data" className="container" onSubmit={handleSubmit}>
                <div className="mb-2 block max-w-md">
                    <Label className="mb-2 block" htmlFor="assignment-submit">
                        Select File to Submit
                    </Label>
                    <FileInput
                        id="assignment-submit"
                        name="file"
                        onChange={handleChange}
                        accept=".pdf,.ppt,.pptx,.docx,.doc, .jpg, .png, .txt"
                        className="max-w-md"
                    />
                    <HelperText>
                        Supported Files: pdf, ppt, pptx, docx, doc, jpg, png, txt. Max File Size:
                        10MB
                    </HelperText>
                </div>

                <Button
                    className="mt-4 w-full max-w-md cursor-pointer place-self-center"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? (
                        <Spinner />
                    ) : (
                        <>
                            <IoCloudUploadOutline className="me-2 h-5 w-5" />
                            Submit Assignment
                        </>
                    )}
                </Button>

                {processing && (
                    <div className="mt-4 flex flex-col gap-2 max-w-md place-self-center w-full">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{statusText}</span>
                            <span className="text-sm">{progress}%</span>
                        </div>
                        <Progress progress={progress} size="sm" color="blue" />
                    </div>
                )}
            </form>

            {
                toast.visible && (
                    <ToastMessage message={toast?.message} type={toast?.type} onClose={closeToast} />
                )
            }
        </div>
    )
}

export default SubmitAssignment