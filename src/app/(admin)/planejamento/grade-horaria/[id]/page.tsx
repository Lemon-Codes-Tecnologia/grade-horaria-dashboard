"use client";
import React, { useMemo, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import { ChevronLeftIcon } from "@/icons";
import GradeHorariaViewer from "@/components/grade-horaria/GradeHorariaViewer";
import TurmaSidebar from "@/components/grade-horaria/TurmaSidebar";
import {
  getGradeHoraria,
  updateGradeTema,
  deleteGradeHoraria,
  exportGradeHorariaPdf,
  validarGradeHoraria,
  gerarGradeAutomaticamente,
  type GradeHoraria,
  type Horario,
  type StatusGrade,
  type GradeThemeConfig,
} from "@/lib/api/grades-horarias";
import { listGradeThemes, type GradeThemePreset } from "@/lib/api/grade-themes";
import {
  listMural,
  createMuralItem,
  updateMuralItem,
  deleteMuralItem,
  toggleMuralPin,
  type MuralItem,
  type MuralStatus,
} from "@/lib/api/mural-grade";
import { useModal } from "@/hooks/useModal";
import { ConfirmDialog } from "@/components/ui/modal/ConfirmDialog";
import { Modal } from "@/components/ui/modal";
import { useSchool } from "@/context/SchoolContext";
import { useGradePolling } from "@/hooks/useGradePolling";
import { resolveGradeTheme } from "@/lib/utils/gradeTheme";
import { useAuth } from "@/context/AuthContext";

export default function DetalhesGradeHorariaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { selectedSchool } = useSchool();
  const { user } = useAuth();

  const [grade, setGrade] = useState<GradeHoraria | null>(null);
  const [gradeThemes, setGradeThemes] = useState<GradeThemePreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegeneratingGrade, setIsRegeneratingGrade] = useState(false);
  const [horarioSelecionado, setHorarioSelecionado] = useState<Horario | null>(null);
  const [temaTipo, setTemaTipo] = useState<"preset" | "custom">("preset");
  const [temaPresetId, setTemaPresetId] = useState<string | null>(null);
  const [temaCustom, setTemaCustom] = useState<GradeThemeConfig>({
    primaryColor: "#6366f1",
    accentColor: "#22c55e",
    background: "#ffffff",
    pattern: "",
  });
  const [isSavingTema, setIsSavingTema] = useState(false);
  const [isDeletingGrade, setIsDeletingGrade] = useState(false);
  const [isExportingGrade, setIsExportingGrade] = useState(false);
  const [muralItems, setMuralItems] = useState<MuralItem[]>([]);
  const [isLoadingMural, setIsLoadingMural] = useState(false);
  const [muralPage, setMuralPage] = useState(1);
  const [muralHasNext, setMuralHasNext] = useState(false);
  const [muralError, setMuralError] = useState<string | null>(null);
  const [isSavingMural, setIsSavingMural] = useState(false);
  const [muralTitulo, setMuralTitulo] = useState("");
  const [muralConteudo, setMuralConteudo] = useState("");
  const [muralStatus, setMuralStatus] = useState<MuralStatus>("publicada");
  const [muralFixada, setMuralFixada] = useState(false);
  const [muralDisciplinaId, setMuralDisciplinaId] = useState("");
  const [muralDisciplinaFiltro, setMuralDisciplinaFiltro] = useState("");
  const [muralAnexos, setMuralAnexos] = useState<File[]>([]);
  const [editingMural, setEditingMural] = useState<MuralItem | null>(null);
  const [muralToDelete, setMuralToDelete] = useState<MuralItem | null>(null);
  const [isDeletingMural, setIsDeletingMural] = useState(false);

  // Modais de confirmação
  const validarModal = useModal();
  const deleteModal = useModal();
  const muralModal = useModal();
  const deleteMuralModal = useModal();

  // Polling para monitorar geração da grade em tempo real
  useGradePolling(grade ? [grade] : [], {
    onComplete: () => {
      toast.success("Grade horária gerada!", {
        description: "A grade foi gerada com sucesso.",
      });
      fetchGrade();
    },
    onError: () => {
      toast.error("Falha ao gerar grade", {
        description: "Verifique os erros abaixo.",
      });
      fetchGrade();
    },
    interval: 30000, // Verifica a cada 30 segundos
  });

  useEffect(() => {
    fetchGrade();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    setMuralPage(1);
    setMuralItems([]);
    setMuralError(null);
  }, [id]);

  useEffect(() => {
    setMuralPage(1);
    setMuralItems([]);
  }, [muralDisciplinaFiltro]);

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const response = await listGradeThemes();
        const themesData = response.data || response.payload;
        if (themesData) {
          setGradeThemes(themesData);
        }
      } catch (error) {
        console.error("Erro ao carregar temas de grade:", error);
      }
    };

    fetchThemes();
  }, []);

  useEffect(() => {
    const fetchMural = async () => {
      setIsLoadingMural(true);
      try {
        setMuralError(null);
        if (!muralDisciplinaFiltro) {
          setMuralItems([]);
          setMuralHasNext(false);
          return;
        }
        const idEscola = selectedSchool?._id || (grade && typeof grade.escola === "object" ? grade.escola._id : grade?.escola);
        const response = await listMural(
          id,
          { page: muralPage, limit: 10 },
          idEscola,
          muralDisciplinaFiltro
        );
        const payload = response.data || response.payload;
        const updateItems = (items: MuralItem[]) => {
          setMuralItems((prev) => (muralPage > 1 ? [...prev, ...items] : items));
        };

        if (Array.isArray(payload)) {
          updateItems(payload);
          setMuralHasNext(false);
        } else if (payload?.docs) {
          updateItems(payload.docs);
          setMuralHasNext(Boolean(payload.hasNextPage));
        } else if (payload?.mural) {
          updateItems(payload.mural);
          setMuralHasNext(false);
        }
      } catch (error) {
        const message =
          (error as any)?.response?.data?.message || "Não foi possível carregar o mural.";
        setMuralError(message);
        setMuralItems([]);
        setMuralHasNext(false);
        toast.error("Erro ao carregar mural", { description: message });
      } finally {
        setIsLoadingMural(false);
      }
    };

    fetchMural();
  }, [id, muralPage, muralDisciplinaFiltro, grade, selectedSchool]);

  const fetchGrade = async () => {
    setIsLoading(true);
    try {
      // Usa o selectedSchool se disponível, senão usa o idEscola da grade já carregada
      const idEscola = selectedSchool?._id || (grade && typeof grade.escola === 'object' ? grade.escola._id : grade?.escola);
      const response = await getGradeHoraria(id, idEscola);
      const gradeData = response.data || response.payload;

      if (gradeData) {
        setGrade(gradeData);

        if (gradeData.tema?.tipo === "preset") {
          setTemaTipo("preset");
          setTemaPresetId(gradeData.tema.id || null);
          if (gradeData.tema.config) {
            setTemaCustom(gradeData.tema.config);
          }
        } else if (gradeData.tema?.tipo === "custom") {
          setTemaTipo("custom");
          setTemaPresetId(null);
          if (gradeData.tema.config) {
            setTemaCustom(gradeData.tema.config);
          }
        }
      }
    } catch (error: any) {
      toast.error("Erro ao carregar grade", {
        description: error.response?.data?.message || "Não foi possível carregar a grade.",
      });
      router.push("/planejamento/grade-horaria");
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidar = async () => {
    if (!grade) return;

    try {
      // Pega o idEscola da grade (pode ser objeto ou string)
      const idEscola = typeof grade.escola === 'object' ? grade.escola._id : grade.escola;
      await validarGradeHoraria(id, idEscola);
      toast.success("Grade validada com sucesso!");
      fetchGrade();
    } catch (error: any) {
      toast.error("Erro ao validar grade", {
        description: error.response?.data?.message || "Não foi possível validar a grade.",
      });
    }
  };

  const handleRegenerarGrade = async () => {
    if (!grade) return;

    setIsRegeneratingGrade(true);
    try {
      // Pega o idEscola da grade (pode ser objeto ou string)
      const idEscola = typeof grade.escola === 'object' ? grade.escola._id : grade.escola;
      const response = await gerarGradeAutomaticamente(id, idEscola);

      if (response.success || response.data || response.payload) {
        toast.success(response.message || "Grade sendo gerada novamente!", {
          description: "Aguarde alguns instantes enquanto a grade é processada.",
        });

        // Recarregar grade após 2 segundos para pegar o novo status
        setTimeout(() => {
          fetchGrade();
        }, 2000);
      }
    } catch (error: any) {
      toast.error("Erro ao regenerar grade", {
        description: error.response?.data?.message || "Não foi possível gerar a grade novamente.",
      });

      if (error.response?.data?.conflitos) {
        console.error("Conflitos:", error.response.data.conflitos);
      }
    } finally {
      setIsRegeneratingGrade(false);
    }
  };

  const getStatusBadge = (status: StatusGrade) => {
    const badges = {
      rascunho: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      ativa: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
      arquivada: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400",
    };

    const labels = {
      rascunho: "Rascunho",
      ativa: "Ativa",
      arquivada: "Arquivada",
    };

    return (
      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const handleHorarioClick = (horario: Horario) => {
    setHorarioSelecionado(horario);
    if (typeof horario.disciplina === "object" && horario.disciplina?._id) {
      setMuralDisciplinaFiltro(horario.disciplina._id);
    }
  };

  const resetMuralForm = () => {
    setMuralTitulo("");
    setMuralConteudo("");
    setMuralStatus("publicada");
    setMuralFixada(false);
    setMuralDisciplinaId("");
    setMuralAnexos([]);
    setEditingMural(null);
  };

  const handleOpenCreateMural = () => {
    resetMuralForm();
    if (muralDisciplinaFiltro) {
      setMuralDisciplinaId(muralDisciplinaFiltro);
    }
    muralModal.openModal();
  };

  const handleOpenEditMural = (item: MuralItem) => {
    setEditingMural(item);
    setMuralTitulo(item.titulo);
    setMuralConteudo(item.conteudo || "");
    setMuralStatus(item.status || "publicada");
    setMuralFixada(Boolean(item.fixada));
    if (item.disciplina && typeof item.disciplina === "object") {
      setMuralDisciplinaId(item.disciplina._id);
    } else if (typeof item.disciplina === "string") {
      setMuralDisciplinaId(item.disciplina);
    } else {
      setMuralDisciplinaId("");
    }
    setMuralAnexos([]);
    muralModal.openModal();
  };

  const validateMuralFiles = (files: File[]) => {
    if (files.length > 5) {
      toast.error("Limite de 5 anexos por nota.");
      return false;
    }
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    for (const file of files) {
      if (!allowed.includes(file.type)) {
        toast.error(`Tipo de arquivo não permitido: ${file.name}`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Arquivo maior que 5MB: ${file.name}`);
        return false;
      }
    }
    return true;
  };

  const handleSaveMural = async () => {
    if (!muralTitulo.trim()) {
      toast.error("Informe um título para a nota.");
      return;
    }
    if (!muralDisciplinaId) {
      toast.error("Selecione a disciplina da nota.");
      return;
    }

    if (!validateMuralFiles(muralAnexos)) return;

    setIsSavingMural(true);
    try {
      const formData = new FormData();
      formData.append("titulo", muralTitulo.trim());
      formData.append("disciplina", muralDisciplinaId);
      if (muralConteudo.trim()) {
        formData.append("conteudo", muralConteudo.trim());
      }
      formData.append("status", muralStatus);
      formData.append("fixada", muralFixada ? "true" : "false");
      muralAnexos.forEach((file) => formData.append("anexos", file));

      const idEscola = typeof grade.escola === "object" ? grade.escola._id : grade.escola;
      const response = editingMural
        ? await updateMuralItem(id, editingMural._id, formData, idEscola)
        : await createMuralItem(id, formData, idEscola);
      const itemData = response.data || response.payload;

      if (itemData) {
        setMuralItems((prev) => {
          if (editingMural) {
            return prev.map((item) => (item._id === itemData._id ? itemData : item));
          }
          return [itemData, ...prev];
        });
      }

      toast.success(editingMural ? "Nota atualizada." : "Nota criada.");
      muralModal.closeModal();
      resetMuralForm();
    } catch (error: any) {
      toast.error("Erro ao salvar nota", {
        description: error.response?.data?.message || "Não foi possível salvar a nota.",
      });
    } finally {
      setIsSavingMural(false);
    }
  };

  const handleDeleteMural = async () => {
    if (!muralToDelete) return;

    setIsDeletingMural(true);
    try {
      const idEscola = typeof grade.escola === "object" ? grade.escola._id : grade.escola;
      await deleteMuralItem(id, muralToDelete._id, idEscola);
      setMuralItems((prev) => prev.filter((item) => item._id !== muralToDelete._id));
      toast.success("Nota excluída.");
    } catch (error: any) {
      toast.error("Erro ao excluir nota", {
        description: error.response?.data?.message || "Não foi possível excluir a nota.",
      });
    } finally {
      setIsDeletingMural(false);
      deleteMuralModal.closeModal();
      setMuralToDelete(null);
    }
  };

  const handleTogglePin = async (item: MuralItem) => {
    try {
      const idEscola = typeof grade.escola === "object" ? grade.escola._id : grade.escola;
      const response = await toggleMuralPin(id, item._id, idEscola);
      const itemData = response.data || response.payload;
      if (itemData) {
        setMuralItems((prev) => prev.map((mural) => (mural._id === itemData._id ? itemData : mural)));
      }
    } catch (error: any) {
      toast.error("Erro ao fixar nota", {
        description: error.response?.data?.message || "Não foi possível fixar a nota.",
      });
    }
  };

  const formatMuralDate = (value?: string) => {
    if (!value) return "-";
    return new Date(value).toLocaleString("pt-BR");
  };

  const handleSalvarTema = async () => {
    if (!grade) return;

    const selectedPreset = gradeThemes.find((item) => item.id === temaPresetId);
    if (temaTipo === "preset" && !selectedPreset) {
      toast.error("Selecione um tema preset.");
      return;
    }

    setIsSavingTema(true);
    try {
      const idEscola = typeof grade.escola === "object" ? grade.escola._id : grade.escola;
      const temaPayload =
        temaTipo === "preset" && selectedPreset
          ? { tipo: "preset" as const, id: selectedPreset.id, config: selectedPreset.config }
          : {
              tipo: "custom" as const,
              config: {
                ...temaCustom,
                pattern: temaCustom.pattern || undefined,
              },
            };

      await updateGradeTema(id, temaPayload, idEscola);
      await fetchGrade();
      toast.success("Tema atualizado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao atualizar tema", {
        description: error.response?.data?.message || "Não foi possível atualizar o tema.",
      });
    } finally {
      setIsSavingTema(false);
    }
  };

  const handleDeleteGrade = async () => {
    if (!grade) return;

    setIsDeletingGrade(true);
    try {
      const idEscola = typeof grade.escola === "object" ? grade.escola._id : grade.escola;
      await deleteGradeHoraria(id, idEscola);
      toast.success("Grade excluída com sucesso!");
      router.push("/planejamento/grade-horaria");
    } catch (error: any) {
      toast.error("Erro ao excluir grade", {
        description: error.response?.data?.message || "Não foi possível excluir a grade.",
      });
    } finally {
      setIsDeletingGrade(false);
      deleteModal.closeModal();
    }
  };

  const handleExportGradePdf = async () => {
    if (!grade) return;

    setIsExportingGrade(true);
    try {
      const idEscola =
        selectedSchool?._id ||
        (grade && typeof grade.escola === "object" ? grade.escola._id : grade?.escola);
      const blob = await exportGradeHorariaPdf(grade._id, idEscola);
      const fileUrl = window.URL.createObjectURL(blob);
      const newWindow = window.open(fileUrl, "_blank", "noopener,noreferrer");
      if (!newWindow) {
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = `grade-${grade._id}.pdf`;
        link.click();
      }
      setTimeout(() => URL.revokeObjectURL(fileUrl), 10000);
    } catch (error: any) {
      toast.error("Erro ao exportar grade", {
        description:
          error.response?.data?.message ||
          "Nao foi possivel exportar a grade em PDF.",
      });
    } finally {
      setIsExportingGrade(false);
    }
  };

  const muralOrdenado = useMemo(() => {
    return [...muralItems].sort((a, b) => {
      if (a.fixada && !b.fixada) return -1;
      if (!a.fixada && b.fixada) return 1;
      return (b.fixadaEm || b.updatedAt || "").localeCompare(a.fixadaEm || a.updatedAt || "");
    });
  }, [muralItems]);
  const disciplinasDisponiveis = useMemo(() => {
    if (!grade?.horarios) return [];
    const map = new Map<string, string>();
    grade.horarios.forEach((horario) => {
      if (typeof horario.disciplina === "object" && horario.disciplina?._id) {
        map.set(horario.disciplina._id, horario.disciplina.nome);
      }
    });
    return Array.from(map.entries()).map(([idDisciplina, nome]) => ({
      id: idDisciplina,
      nome,
    }));
  }, [grade?.horarios]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
      </div>
    );
  }

  if (!grade) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 dark:text-gray-400">Grade não encontrada</p>
      </div>
    );
  }

  const turmaInfo = typeof grade.turma === "object" ? grade.turma : null;
  const selectedPreset = gradeThemes.find((item) => item.id === temaPresetId);
  const { config: temaConfig, assets: temaAssets } = resolveGradeTheme(
    temaTipo === "custom"
      ? { tipo: "custom", config: temaCustom }
      : { tipo: "preset", id: temaPresetId || undefined, config: selectedPreset?.config },
    gradeThemes
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/planejamento/grade-horaria">
          <button className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800">
            <ChevronLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-400" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            {grade.nome}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {turmaInfo ? `${turmaInfo.nome} (${turmaInfo.codigo})` : "Turma não encontrada"}
          </p>
        </div>
        <div className="flex gap-2">
          {!grade.validada && (
            <>
              <Link href={`/planejamento/grade-horaria/${id}/editar`}>
                <Button variant="outline">Editar</Button>
              </Link>
              <Button onClick={validarModal.openModal} disabled={!grade.horarios || grade.horarios.length === 0}>
                Validar Grade
              </Button>
            </>
          )}
          <Button
            variant="outline"
            onClick={handleExportGradePdf}
            disabled={isExportingGrade}
          >
            {isExportingGrade ? "Exportando..." : "Exportar PDF"}
          </Button>
          <Button variant="outline" onClick={deleteModal.openModal} disabled={isDeletingGrade}>
            Excluir
          </Button>
        </div>
      </div>

      {/* Informações da Grade */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
          <div className="mt-2">
            {getStatusBadge(grade.status)}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Ano Letivo</p>
          <p className="mt-2 text-xl font-semibold text-gray-800 dark:text-white/90">
            {grade.anoLetivo}/{grade.semestre}º semestre
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total de Aulas</p>
          <p className="mt-2 text-xl font-semibold text-gray-800 dark:text-white/90">
            {grade.horarios?.length || 0}
          </p>
        </div>
      </div>

      {/* Descrição */}
      {grade.descricao && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white/90 mb-2">Descrição</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300">{grade.descricao}</p>
        </div>
      )}

      {/* Card de Erro - Falha ao Gerar Grade Horária */}
      {grade.geracao?.status === "falhou" && grade.geracao.erros && grade.geracao.erros.length > 0 && (
        <div className="rounded-xl border border-error-200 bg-error-50 p-6 dark:border-error-800 dark:bg-error-900/20">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-100 dark:bg-error-900/40">
                <svg className="h-6 w-6 text-error-600 dark:text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-error-800 dark:text-error-400 mb-2">
                Falha ao Gerar Grade Horária
              </h3>
              <p className="text-sm text-error-700 dark:text-error-300 mb-4">
                Não foi possível gerar a grade automaticamente. Corrija os problemas abaixo e tente novamente:
              </p>
              <ul className="space-y-2 mb-6">
                {grade.geracao.erros.map((erro, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-error-700 dark:text-error-300">
                    <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{erro}</span>
                  </li>
                ))}
              </ul>

              {/* Disciplinas Não Alocadas dentro do card de erro */}
              {grade.disciplinasNaoAlocadas && grade.disciplinasNaoAlocadas.length > 0 && (
                <div className="mb-6">
                  <div className="mb-3 pb-3 border-b border-error-200 dark:border-error-700">
                    <h4 className="text-base font-semibold text-error-800 dark:text-error-400">
                      Disciplinas Não Alocadas
                    </h4>
                    <p className="text-sm text-error-700 dark:text-error-300 mt-1">
                      {grade.disciplinasNaoAlocadas.length === 1
                        ? "1 disciplina não pôde ser totalmente alocada na grade horária."
                        : `${grade.disciplinasNaoAlocadas.length} disciplinas não puderam ser totalmente alocadas na grade horária.`}
                    </p>
                  </div>
                  <div className="space-y-3">
                    {grade.disciplinasNaoAlocadas.map((disciplina, index) => (
                      <div key={index} className="rounded-lg border border-error-200 bg-white p-3 dark:border-error-700 dark:bg-error-900/10">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h5 className="text-sm font-medium text-gray-800 dark:text-white/90">
                              {disciplina.disciplinaNome}
                            </h5>
                            <p className="text-xs text-error-600 dark:text-error-400 mt-0.5">
                              {disciplina.aulasNaoAlocadas} {disciplina.aulasNaoAlocadas === 1 ? 'aula não alocada' : 'aulas não alocadas'}
                            </p>
                          </div>
                          <span className="inline-flex items-center rounded-full bg-error-100 px-2.5 py-0.5 text-xs font-medium text-error-800 dark:bg-error-900/30 dark:text-error-400">
                            Incompleta
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                            Motivos:
                          </p>
                          <ul className="space-y-1">
                            {disciplina.motivos.map((motivo, mIndex) => (
                              <li key={mIndex} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                                <svg className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-error-600 dark:text-error-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span>{motivo}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleRegenerarGrade}
                  disabled={isRegeneratingGrade}
                  className="bg-error-600 hover:bg-error-700 text-white"
                >
                  {isRegeneratingGrade ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Regenerando...
                    </>
                  ) : (
                    "Tentar Gerar Novamente"
                  )}
                </Button>
                <p className="text-xs text-error-600 dark:text-error-400">
                  Certifique-se de corrigir os problemas antes de tentar novamente
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grade Horária e Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grade Horária - 70% */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-medium text-gray-800 dark:text-white/90 mb-4">
              Grade Horária
            </h2>

            {(grade.horarios && grade.horarios.length > 0) ||
            (grade.slotsIntervalo && grade.slotsIntervalo.length > 0) ? (
              <GradeHorariaViewer
                horarios={grade.horarios}
                slotsIntervalo={grade.slotsIntervalo}
                onHorarioClick={handleHorarioClick}
                selectedHorarioId={horarioSelecionado?._id}
                diasLetivos={selectedSchool?.configuracoes?.diasLetivos}
                temaConfig={temaConfig}
                temaAssets={temaAssets}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  Nenhum horário alocado ainda. A grade será gerada automaticamente pela API.
                </p>
              </div>
            )}
          </div>

          {/* Mural */}
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h2 className="text-lg font-medium text-gray-800 dark:text-white/90">
                  Notas
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Notas e anexos da grade horária
                </p>
                {muralDisciplinaFiltro ? (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Disciplina selecionada:{" "}
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {disciplinasDisponiveis.find((disciplina) => disciplina.id === muralDisciplinaFiltro)?.nome || "-"}
                    </span>
                  </p>
                ) : null}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenCreateMural}
                disabled={Boolean(muralError) || !muralDisciplinaFiltro}
              >
                Nova nota
              </Button>
            </div>
            {muralError ? (
              <div className="rounded-lg border border-error-200 bg-error-50 p-6 text-center text-sm text-error-700 dark:border-error-800 dark:bg-error-900/20 dark:text-error-400">
                {muralError}
              </div>
            ) : !muralDisciplinaFiltro ? (
              <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                Selecione uma disciplina na grade para visualizar as notas.
              </div>
            ) : isLoadingMural ? (
              <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                Carregando mural...
              </div>
            ) : muralOrdenado.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                Nenhuma nota ainda.
              </div>
            ) : (
              <div className="space-y-4">
                {muralOrdenado.map((item) => {
                  const autor = typeof item.autor === "object" ? item.autor : null;
                  const canEdit = user?.id && autor?._id === user.id;
                  return (
                    <div
                      key={item._id}
                      className="rounded-lg border border-amber-200 bg-amber-50/80 p-4 shadow-sm dark:border-amber-900/40 dark:bg-amber-900/10"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90 truncate">
                          {item.titulo}
                        </h3>
                        {item.fixada && (
                          <span className="inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
                            Fixada
                          </span>
                        )}
                        {item.disciplina && typeof item.disciplina === "object" && (
                          <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                            {item.disciplina.nome}
                          </span>
                        )}
                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {item.status}
                        </span>
                      </div>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {autor?.nome || "Autor desconhecido"} • {formatMuralDate(item.updatedAt || item.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleTogglePin(item)}
                            className="rounded-lg px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                          >
                            {item.fixada ? "Desfixar" : "Fixar"}
                          </button>
                          {canEdit && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditMural(item)}
                                className="rounded-lg px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                              >
                              Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMuralToDelete(item);
                                  deleteMuralModal.openModal();
                                }}
                                disabled={isDeletingMural && muralToDelete?._id === item._id}
                                className="rounded-lg px-2 py-1 text-xs font-medium text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-900/20"
                              >
                                Excluir
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      {item.conteudo && (
                        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                          {item.conteudo}
                        </p>
                      )}
                      {item.anexos && item.anexos.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.anexos.map((anexo) => (
                            <a
                              key={anexo.url}
                              href={anexo.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                              <span>{anexo.nome}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {muralHasNext && (
              <div className="mt-4 flex justify-center">
                <Button variant="outline" size="sm" onClick={() => setMuralPage((prev) => prev + 1)}>
                  Carregar mais
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - 30% */}
        <div className="lg:col-span-1">
          <TurmaSidebar
            horarioSelecionado={horarioSelecionado}
            todosHorarios={grade.horarios || []}
          />

          {/* Tema da Grade */}
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                Tema da Grade
              </h2>
              <Button size="sm" variant="outline" onClick={handleSalvarTema} disabled={isSavingTema}>
                {isSavingTema ? "Salvando..." : "Salvar"}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                type="button"
                onClick={() => setTemaTipo("preset")}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  temaTipo === "preset"
                    ? "bg-brand-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                Presets
              </button>
              <button
                type="button"
                onClick={() => setTemaTipo("custom")}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  temaTipo === "custom"
                    ? "bg-brand-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                Custom
              </button>
            </div>

            {temaTipo === "preset" ? (
              <div className="grid grid-cols-2 gap-3">
                {gradeThemes.length === 0 && (
                  <div className="rounded-lg border border-dashed border-gray-200 p-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
                    Nenhum tema preset disponível no momento.
                  </div>
                )}
                {gradeThemes.map((theme) => {
                  const previewBg = theme.config?.background || "#ffffff";
                  const previewPrimary = theme.config?.primaryColor || "#6366f1";
                  const isSelected = temaPresetId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setTemaPresetId(theme.id)}
                      className={`rounded-lg border p-2 text-left transition ${
                        isSelected
                          ? "border-brand-500 ring-1 ring-brand-200"
                          : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700"
                      }`}
                    >
                      <div
                        className="h-10 w-full rounded-md border border-gray-200 dark:border-gray-800"
                        style={{
                          background: previewBg,
                          backgroundImage: `linear-gradient(135deg, ${previewPrimary}33 0%, transparent 55%)`,
                        }}
                      />
                      <p className="mt-2 text-xs font-medium text-gray-700 dark:text-gray-200">
                        {theme.nome}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="detalhesPrimary">Cor primária</Label>
                  <input
                    id="detalhesPrimary"
                    type="color"
                    value={temaCustom.primaryColor || "#6366f1"}
                    onChange={(e) => setTemaCustom((prev) => ({ ...prev, primaryColor: e.target.value }))}
                    className="h-10 w-full cursor-pointer rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-900"
                  />
                </div>
                <div>
                  <Label htmlFor="detalhesAccent">Cor de destaque</Label>
                  <input
                    id="detalhesAccent"
                    type="color"
                    value={temaCustom.accentColor || "#22c55e"}
                    onChange={(e) => setTemaCustom((prev) => ({ ...prev, accentColor: e.target.value }))}
                    className="h-10 w-full cursor-pointer rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-900"
                  />
                </div>
                <div>
                  <Label htmlFor="detalhesBackground">Cor de fundo</Label>
                  <input
                    id="detalhesBackground"
                    type="color"
                    value={temaCustom.background || "#ffffff"}
                    onChange={(e) => setTemaCustom((prev) => ({ ...prev, background: e.target.value }))}
                    className="h-10 w-full cursor-pointer rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-900"
                  />
                </div>
                <div>
                  <Label htmlFor="detalhesPattern">Padrão</Label>
                  <select
                    id="detalhesPattern"
                    value={temaCustom.pattern || ""}
                    onChange={(e) => setTemaCustom((prev) => ({ ...prev, pattern: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                  >
                    <option value="">Sem padrão</option>
                    <option value="dots">Pontilhado</option>
                    <option value="snow">Neve</option>
                    <option value="hearts">Corações</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Modais de Confirmação */}
      {grade && (
        <>
          <ConfirmDialog
            isOpen={validarModal.isOpen}
            onClose={validarModal.closeModal}
            onConfirm={handleValidar}
            title="Validar Grade"
            description={`Tem certeza que deseja validar a grade "${grade.nome}"? Esta ação não pode ser desfeita.`}
            confirmText="Validar"
            cancelText="Cancelar"
            variant="warning"
          />
          <ConfirmDialog
            isOpen={deleteModal.isOpen}
            onClose={deleteModal.closeModal}
            onConfirm={handleDeleteGrade}
            title="Excluir Grade"
            description={`Tem certeza que deseja excluir a grade "${grade.nome}"? Esta ação não pode ser desfeita.`}
            confirmText="Excluir"
            cancelText="Cancelar"
            variant="danger"
          />
          <ConfirmDialog
            isOpen={deleteMuralModal.isOpen}
            onClose={deleteMuralModal.closeModal}
            onConfirm={handleDeleteMural}
            title="Excluir Nota"
            description={`Tem certeza que deseja excluir a nota "${muralToDelete?.titulo || ""}"?`}
            confirmText="Excluir"
            cancelText="Cancelar"
            variant="danger"
          />
        </>
      )}

      <Modal isOpen={muralModal.isOpen} onClose={muralModal.closeModal} className="mx-4 max-w-2xl">
        <div className="px-6 py-5">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {editingMural ? "Editar nota" : "Nova nota"}
          </h3>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="muralTitulo">Título</Label>
              <input
                id="muralTitulo"
                type="text"
                value={muralTitulo}
                onChange={(e) => setMuralTitulo(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
              />
            </div>
            <div>
              <Label htmlFor="muralDisciplina">Disciplina</Label>
              <select
                id="muralDisciplina"
                value={muralDisciplinaId}
                onChange={(e) => setMuralDisciplinaId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
              >
                <option value="">Selecione a disciplina</option>
                {disciplinasDisponiveis.map((disciplina) => (
                  <option key={disciplina.id} value={disciplina.id}>
                    {disciplina.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="muralConteudo">Conteúdo</Label>
              <textarea
                id="muralConteudo"
                value={muralConteudo}
                onChange={(e) => setMuralConteudo(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="muralStatus">Status</Label>
                <select
                  id="muralStatus"
                  value={muralStatus}
                  onChange={(e) => setMuralStatus(e.target.value as MuralStatus)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                >
                  <option value="rascunho">Rascunho</option>
                  <option value="publicada">Publicada</option>
                  <option value="arquivada">Arquivada</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="muralFixada"
                  type="checkbox"
                  checked={muralFixada}
                  onChange={(e) => setMuralFixada(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <Label htmlFor="muralFixada" className="mb-0">
                  Fixar aviso
                </Label>
              </div>
            </div>
            <div>
              <Label htmlFor="muralAnexos">Anexos (PDF/JPG/PNG/WEBP)</Label>
              <input
                id="muralAnexos"
                type="file"
                multiple
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={(e) => setMuralAnexos(Array.from(e.target.files || []))}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:file:bg-gray-800 dark:file:text-gray-200"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Até 5 anexos, 5MB cada. No update os anexos enviados são adicionados.
              </p>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={muralModal.closeModal}>
              Cancelar
            </Button>
            <Button onClick={handleSaveMural} disabled={isSavingMural}>
              {isSavingMural ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
