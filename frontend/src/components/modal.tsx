import type { ReactNode } from 'react';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';

type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    size?: 'md' | 'lg';
};

const sizeClass = { md: 'max-w-md', lg: 'max-w-xl' };

const Modal = ({ isOpen, onClose, children, size = 'md' }: ModalProps) => {
    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-black/30 transition-opacity duration-200 data-closed:opacity-0"
            />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel
                    transition
                    className={`w-full ${sizeClass[size]} rounded-lg bg-white shadow-xl transition duration-200 data-closed:scale-95 data-closed:opacity-0`}
                >
                    {children}
                </DialogPanel>
            </div>
        </Dialog>
    );
};

export default Modal;
