import { deleteUser } from "@/lib/api/users";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Hook for deleting user accounts (Admin/Support only)
 *
 * Usage example:
 * ```tsx
 * const { deleteUserAccount, isDeleting } = useDeleteUser();
 *
 * const handleDelete = async () => {
 *   const success = await deleteUserAccount(userId);
 *   if (success) {
 *     // Reload list or navigate away
 *   }
 * };
 * ```
 */
export function useDeleteUser() {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteUserAccount = async (userId: string): Promise<boolean> => {
    setIsDeleting(true);

    try {
      const response = await deleteUser(userId);

      if (response.success) {
        // Check for success message from API
        if (
          response.message?.includes(
            "Atenção! Todas as informações da conta foram deletadas"
          )
        ) {
          toast.success("Conta excluída", {
            description: "Todas as informações da conta foram deletadas com sucesso.",
          });
        } else {
          toast.success("Conta excluída", {
            description: response.message || "Usuário removido com sucesso.",
          });
        }

        setIsDeleting(false);
        return true;
      }

      setIsDeleting(false);
      return false;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message;
      const statusCode = error.response?.status;

      if (statusCode === 403) {
        toast.error("Sem permissão", {
          description:
            errorMessage ||
            "Você não tem permissão para excluir esta conta. Apenas administradores podem realizar esta ação.",
        });
      } else if (statusCode === 404) {
        toast.error("Usuário não encontrado", {
          description: errorMessage || "O usuário que você está tentando excluir não existe.",
        });
      } else {
        toast.error("Erro ao excluir conta", {
          description: errorMessage || "Ocorreu um erro ao excluir a conta. Tente novamente.",
        });
      }

      setIsDeleting(false);
      return false;
    }
  };

  return {
    deleteUserAccount,
    isDeleting,
  };
}
