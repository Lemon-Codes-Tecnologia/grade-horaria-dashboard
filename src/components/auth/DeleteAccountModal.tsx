"use client";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useDeleteUser } from "@/hooks/useDeleteUser";
import React from "react";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  onSuccess?: () => void;
}

/**
 * Modal component for deleting user accounts (Admin/Support only)
 *
 * Usage example:
 * ```tsx
 * const [isModalOpen, setIsModalOpen] = useState(false);
 *
 * <DeleteAccountModal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   userId="user-id-here"
 *   userName="John Doe"
 *   onSuccess={() => {
 *     // Reload user list or navigate away
 *     fetchUsers();
 *   }}
 * />
 * ```
 */
export default function DeleteAccountModal({
  isOpen,
  onClose,
  userId,
  userName,
  onSuccess,
}: DeleteAccountModalProps) {
  const { deleteUserAccount, isDeleting } = useDeleteUser();

  const handleConfirmDelete = async () => {
    const success = await deleteUserAccount(userId);

    if (success) {
      onClose();
      onSuccess?.();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white">
          Excluir conta de usuário
        </h2>

        <div className="mb-6">
          <div className="p-4 mb-4 border-l-4 border-error-500 bg-error-50 dark:bg-error-900/20">
            <p className="text-sm font-medium text-error-700 dark:text-error-400">
              Atenção! Esta ação é irreversível
            </p>
          </div>

          <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">
            Você está prestes a excluir a conta do usuário:
          </p>
          <p className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
            {userName}
          </p>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Todas as informações associadas a esta conta serão permanentemente
            deletadas, incluindo:
          </p>
          <ul className="mt-2 ml-5 text-sm text-gray-600 list-disc dark:text-gray-400">
            <li>Dados pessoais</li>
            <li>Configurações</li>
            <li>Histórico de atividades</li>
            <li>Conteúdo criado</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className="flex-1 bg-error-600 hover:bg-error-700 focus:ring-error-500"
          >
            {isDeleting ? "Excluindo..." : "Excluir conta"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
