"use client";

import React, { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  // Handle clicking outside to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={handleBackdropClick}
      className="card p-0 w-full max-w-md animate-scale-in backdrop:bg-black/50 backdrop:backdrop-blur-sm open:flex flex-col"
      style={{
        margin: "auto",
        background: "var(--color-surface-0)",
      }}
    >
      <div
        className="flex justify-between items-center p-6 border-b"
        style={{ borderColor: "var(--color-border-subtle)" }}
      >
        <h3 className="font-semibold text-lg">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          className="btn btn-ghost btn-icon"
          aria-label="Close modal"
        >
          ✕
        </button>
      </div>
      <div className="p-6">{children}</div>
    </dialog>
  );
}
