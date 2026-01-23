"use client";
import React from "react";
import { Modal } from "./index";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "warning" | "danger" | "info";
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "warning",
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const variantStyles = {
    warning: {
      iconBg: "fill-warning-50 dark:fill-warning-500/15",
      icon: "fill-warning-600 dark:fill-orange-400",
      button: "bg-warning-500 hover:bg-warning-600",
    },
    danger: {
      iconBg: "fill-error-50 dark:fill-error-500/15",
      icon: "fill-error-600 dark:fill-error-500",
      button: "bg-error-500 hover:bg-error-600",
    },
    info: {
      iconBg: "fill-blue-light-50 dark:fill-blue-light-500/15",
      icon: "fill-blue-light-500 dark:fill-blue-light-500",
      button: "bg-blue-light-500 hover:bg-blue-light-600",
    },
  };

  const styles = variantStyles[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[600px] p-5 lg:p-10">
      <div className="text-center">
        <div className="relative flex items-center justify-center z-1 mb-7">
          <svg
            className={styles.iconBg}
            width="90"
            height="90"
            viewBox="0 0 90 90"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M34.364 6.85053C38.6205 -2.28351 51.3795 -2.28351 55.636 6.85053C58.0129 11.951 63.5594 14.6722 68.9556 13.3853C78.6192 11.0807 86.5743 21.2433 82.2185 30.3287C79.7862 35.402 81.1561 41.5165 85.5082 45.0122C93.3019 51.2725 90.4628 63.9451 80.7747 66.1403C75.3648 67.3661 71.5265 72.2695 71.5572 77.9156C71.6123 88.0265 60.1169 93.6664 52.3918 87.3184C48.0781 83.7737 41.9219 83.7737 37.6082 87.3184C29.8831 93.6664 18.3877 88.0266 18.4428 77.9156C18.4735 72.2695 14.6352 67.3661 9.22531 66.1403C-0.462787 63.9451 -3.30193 51.2725 4.49185 45.0122C8.84391 41.5165 10.2138 35.402 7.78151 30.3287C3.42572 21.2433 11.3808 11.0807 21.0444 13.3853C26.4406 14.6722 31.9871 11.951 34.364 6.85053Z"
              fill=""
              fillOpacity=""
            />
          </svg>

          <span className="absolute -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
            {variant === "danger" || variant === "warning" ? (
              <svg
                className={styles.icon}
                width="38"
                height="38"
                viewBox="0 0 38 38"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M32.1445 19.0002C32.1445 26.2604 26.2589 32.146 18.9987 32.146C11.7385 32.146 5.85287 26.2604 5.85287 19.0002C5.85287 11.7399 11.7385 5.85433 18.9987 5.85433C26.2589 5.85433 32.1445 11.7399 32.1445 19.0002ZM18.9987 35.146C27.9158 35.146 35.1445 27.9173 35.1445 19.0002C35.1445 10.0831 27.9158 2.85433 18.9987 2.85433C10.0816 2.85433 2.85287 10.0831 2.85287 19.0002C2.85287 27.9173 10.0816 35.146 18.9987 35.146ZM21.0001 26.0855C21.0001 24.9809 20.1047 24.0855 19.0001 24.0855L18.9985 24.0855C17.894 24.0855 16.9985 24.9809 16.9985 26.0855C16.9985 27.19 17.894 28.0855 18.9985 28.0855L19.0001 28.0855C20.1047 28.0855 21.0001 27.19 21.0001 26.0855ZM18.9986 10.1829C19.827 10.1829 20.4986 10.8545 20.4986 11.6829L20.4986 20.6707C20.4986 21.4992 19.827 22.1707 18.9986 22.1707C18.1701 22.1707 17.4986 21.4992 17.4986 20.6707L17.4986 11.6829C17.4986 10.8545 18.1701 10.1829 18.9986 10.1829Z"
                  fill=""
                />
              </svg>
            ) : (
              <svg
                className={styles.icon}
                width="38"
                height="38"
                viewBox="0 0 38 38"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M5.85547 18.9998C5.85547 11.7396 11.7411 5.854 19.0013 5.854C26.2615 5.854 32.1471 11.7396 32.1471 18.9998C32.1471 26.2601 26.2615 32.1457 19.0013 32.1457C11.7411 32.1457 5.85547 26.2601 5.85547 18.9998ZM19.0013 2.854C10.0842 2.854 2.85547 10.0827 2.85547 18.9998C2.85547 27.9169 10.0842 35.1457 19.0013 35.1457C27.9184 35.1457 35.1471 27.9169 35.1471 18.9998C35.1471 10.0827 27.9184 2.854 19.0013 2.854ZM16.9999 11.9145C16.9999 13.0191 17.8953 13.9145 18.9999 13.9145H19.0015C20.106 13.9145 21.0015 13.0191 21.0015 11.9145C21.0015 10.81 20.106 9.91454 19.0015 9.91454H18.9999C17.8953 9.91454 16.9999 10.81 16.9999 11.9145ZM19.0014 27.8171C18.173 27.8171 17.5014 27.1455 17.5014 26.3171V17.3293C17.5014 16.5008 18.173 15.8293 19.0014 15.8293C19.8299 15.8293 20.5014 16.5008 20.5014 17.3293L20.5014 26.3171C20.5014 27.1455 19.8299 27.8171 19.0014 27.8171Z"
                  fill=""
                />
              </svg>
            )}
          </span>
        </div>

        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90 sm:text-title-sm">
          {title}
        </h4>
        <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">
          {description}
        </p>

        <div className="flex items-center justify-center w-full gap-3 mt-7">
          <button
            type="button"
            onClick={onClose}
            className="flex justify-center w-full px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-theme-xs hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700 sm:w-auto"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`flex justify-center w-full px-4 py-3 text-sm font-medium text-white rounded-lg shadow-theme-xs sm:w-auto ${styles.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};