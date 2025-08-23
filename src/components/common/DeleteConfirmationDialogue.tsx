import { Modal, ModalHeader, ModalBody, Button, Spinner } from "flowbite-react";
import { HiOutlineExclamationCircle } from "react-icons/hi";

type DeleteType = {
  isDeleting: boolean;
  isOpen: boolean;
  handleDelete: () => void;
  itemToDelete: string;
  onClose: () => void;
};

export const DeleteConfirmationDialogue = ({
  isDeleting,
  handleDelete,
  itemToDelete,
  isOpen,
  onClose,
}: DeleteType) => {
  return (
    <>
      <Modal show={isOpen} size="lg" onClose={onClose} popup>
        <ModalHeader />
        <ModalBody>
          <div className="text-center">
            <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
              Are you sure you want to delete{" "}
              <span className="font-bold">{itemToDelete}</span>?
            </h3>
            <div className="flex justify-center gap-4">
              <Button
                color="red"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting && <Spinner size="md" className="me-2 h-4 w-4" />}
                Yes, I'm sure
              </Button>
              <Button color="alternative" onClick={onClose}>
                No, cancel
              </Button>
            </div>
          </div>
        </ModalBody>
      </Modal>
    </>
  );
};
