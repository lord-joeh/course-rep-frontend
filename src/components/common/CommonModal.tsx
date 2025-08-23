import React from "react";
import { Modal, ModalHeader, ModalBody } from "flowbite-react";

interface ModalInterface {
  open: boolean;
  children: React.ReactNode;
  onClose: () => void;
}
const CommonModal = ({ open, onClose, children }: ModalInterface) => {
  return (
    <>
      <Modal show={open} size="lg" onClose={onClose} popup>
        <ModalHeader />
        <ModalBody>{children}</ModalBody>
      </Modal>
    </>
  );
};

export default CommonModal;
