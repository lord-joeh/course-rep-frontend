import { Modal, ModalHeader, ModalBody } from "flowbite-react";
import { ModalInterface } from "../../utils/Interfaces";

const CommonModal = ({ open, onClose, children }: ModalInterface) => {
  return (
      <Modal show={open} size="lg" onClose={onClose} popup dismissible position="center">
        <ModalHeader />
        <ModalBody>{children}</ModalBody>
      </Modal>
  );
};

export default CommonModal;
