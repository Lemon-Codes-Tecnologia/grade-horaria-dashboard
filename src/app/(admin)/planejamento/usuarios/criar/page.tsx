"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Checkbox from "@/components/form/input/Checkbox";
import { ChevronLeftIcon } from "@/icons";
import { useAuth } from "@/context/AuthContext";
import { useSchool } from "@/context/SchoolContext";
import {
  createUserBySchool,
  getProfiles,
  getUserTypes,
  type CreateUserBySchoolData,
} from "@/lib/api/users";
import { listTurmas, type Turma } from "@/lib/api/turmas";
import { listProfessores, type Professor } from "@/lib/api/professores";
import {
  canManageUsers,
  isDirector,
  isCoordinator,
  isCoordinatorAllowedType,
  formatPermissionLabel,
  sortPermissions,
  USER_TYPE_LABELS,
  USER_TYPE_OPTIONS,
} from "@/lib/utils/user";

const userSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
});

type UserFormData = z.infer<typeof userSchema>;

export default function CriarUsuarioPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { schools, selectedSchool } = useSchool();

  const [userType, setUserType] = useState("");
  const [userTypeOptions, setUserTypeOptions] = useState(USER_TYPE_OPTIONS);
  const [profileLabels, setProfileLabels] = useState<Record<string, string>>({});
  const [availablePermissions, setAvailablePermissions] = useState<string[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [schoolId, setSchoolId] = useState("");
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [turmaId, setTurmaId] = useState("");
  const [professorId, setProfessorId] = useState("");
  const [filhosInput, setFilhosInput] = useState("");
  const [isLoadingRelations, setIsLoadingRelations] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasPermission = canManageUsers(authUser?.tipo);
  const isDiretor = isDirector(authUser?.tipo);
  const isCoordenador = isCoordinator(authUser?.tipo);

  const buildTypeOptions = (
    types: string[],
    labels: Record<string, string>
  ) =>
    types.map((tipo) => ({
      value: tipo,
      label: labels[tipo] || USER_TYPE_LABELS[tipo] || tipo,
    }));

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((item) => item !== permission)
        : [...prev, permission]
    );
  };

  const handleSelectAllPermissions = () => {
    setSelectedPermissions(availablePermissions);
  };

  const permissionGroups = useMemo(() => {
    const groups: Record<string, string[]> = {};
    const order: string[] = [];
    availablePermissions.forEach((permission) => {
      const [resource = "outros"] = permission.split(":");
      if (!groups[resource]) {
        groups[resource] = [];
        order.push(resource);
      }
      groups[resource].push(permission);
    });
    return order.map((resource) => ({
      resource,
      permissions: groups[resource],
    }));
  }, [availablePermissions]);

  const formatResourceLabel = (resource: string) =>
    resource
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      nome: "",
      email: "",
    },
  });

  useEffect(() => {
    if (isDiretor) {
      setSchoolId(selectedSchool?._id || "");
    } else if (!schoolId && selectedSchool?._id) {
      setSchoolId(selectedSchool._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSchool, isDiretor]);

  useEffect(() => {
    const fetchTypes = async () => {
      if (!hasPermission) return;
      setIsLoadingTypes(true);
      try {
        let types: string[] = [];
        let labels: Record<string, string> = {};

        try {
          const profilesResponse = await getProfiles();
          const profiles =
            profilesResponse.data || profilesResponse.payload || [];
          if (profiles.length) {
            labels = profiles.reduce<Record<string, string>>((acc, profile) => {
              acc[profile.slug] =
                profile.nome || USER_TYPE_LABELS[profile.slug] || profile.slug;
              return acc;
            }, {});
            const uniquePermissions = Array.from(
              new Set(
                profiles.flatMap((profile) => profile.permissoes || [])
              )
            );
            setAvailablePermissions(sortPermissions(uniquePermissions));
          } else {
            setAvailablePermissions([]);
          }
          setProfileLabels(labels);

          const currentProfile = authUser?.tipo
            ? profiles.find((profile) => profile.slug === authUser.tipo)
            : undefined;
          types = currentProfile?.podeCriarTipos || [];
        } catch (error) {
          // Ignore profile errors and try fallback types endpoint
        }

        if (!types.length) {
          const response = await getUserTypes();
          const payload = response.data || response.payload;
          types = payload?.tiposCriacaoEscola || [];
        }

        if (types.length) {
          const filteredTypes = isCoordenador
            ? types.filter(isCoordinatorAllowedType)
            : types;
          setUserTypeOptions(buildTypeOptions(filteredTypes, labels));
          setUserType((prev) => (filteredTypes.includes(prev) ? prev : ""));
          return;
        }

        const fallback = isCoordenador
          ? USER_TYPE_OPTIONS.filter((option) =>
              isCoordinatorAllowedType(option.value)
            )
          : USER_TYPE_OPTIONS;
        setUserTypeOptions(fallback);
      } catch (error) {
        const fallback = isCoordenador
          ? USER_TYPE_OPTIONS.filter((option) =>
              isCoordinatorAllowedType(option.value)
            )
          : USER_TYPE_OPTIONS;
        setUserTypeOptions(fallback);
      } finally {
        setIsLoadingTypes(false);
      }
    };

    fetchTypes();
  }, [hasPermission, isCoordenador, authUser?.tipo]);

  useEffect(() => {
    const fetchRelations = async () => {
      if (!schoolId) {
        setTurmas([]);
        setProfessores([]);
        return;
      }

      setIsLoadingRelations(true);
      try {
        const [turmasResponse, professoresResponse] = await Promise.all([
          listTurmas({ idEscola: schoolId, limit: 100 }),
          listProfessores({ idEscola: schoolId, limit: 100 }),
        ]);

        const turmasData = turmasResponse.data || turmasResponse.payload;
        const professoresData =
          professoresResponse.data || professoresResponse.payload;

        setTurmas(turmasData?.docs || []);
        setProfessores(professoresData?.docs || []);
      } catch (error: any) {
        toast.error("Erro ao carregar dados", {
          description:
            error.response?.data?.message ||
            "Não foi possível carregar turmas e professores.",
        });
      } finally {
        setIsLoadingRelations(false);
      }
    };

    if (userType === "aluno" || userType === "professor") {
      fetchRelations();
    }
  }, [schoolId, userType]);

  const schoolOptions = useMemo(
    () =>
      schools.map((school) => ({
        value: school._id,
        label: school.nome,
      })),
    [schools]
  );

  const turmaOptions = useMemo(
    () =>
      turmas.map((turma) => ({
        value: turma._id,
        label: `${turma.nome} (${turma.codigo})`,
      })),
    [turmas]
  );

  const professorOptions = useMemo(
    () =>
      professores.map((professor) => ({
        value: professor._id,
        label: professor.nome,
      })),
    [professores]
  );

  const onSubmit = async (data: UserFormData) => {
    if (!hasPermission) return;
    if (!schoolId) {
      toast.error("Selecione uma escola", {
        description: "Informe a escola para cadastrar o usuário.",
      });
      return;
    }
    if (!userType) {
      toast.error("Selecione o tipo de usuário", {
        description: "Informe o tipo para cadastrar o usuário.",
      });
      return;
    }
    if (isCoordenador && !isCoordinatorAllowedType(userType)) {
      toast.error("Tipo de usuário inválido", {
        description: "Coordenadores podem cadastrar apenas professor, secretário, aluno, pai, mãe ou responsável.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateUserBySchoolData = {
        nome: data.nome,
        email: data.email,
        tipo: userType,
      };
      if (selectedPermissions.length) {
        payload.permissoes = selectedPermissions;
      }

      if (schoolId) {
        payload.escolaId = schoolId;
      }
      if (userType === "aluno" && turmaId) {
        payload.turmaId = turmaId;
      }
      if (userType === "professor" && professorId) {
        payload.professorId = professorId;
      }
      if (userType === "pai" || userType === "responsavel") {
        const filhos = filhosInput
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
        if (filhos.length > 0) {
          payload.filhos = filhos;
        }
      }

      const response = await createUserBySchool(payload);
      toast.success("Usuário criado", {
        description:
          response.message ||
          "O usuário foi cadastrado e as credenciais foram enviadas.",
      });
      router.push("/planejamento/usuarios");
    } catch (error: any) {
      toast.error("Erro ao criar usuário", {
        description:
          error.response?.data?.message ||
          "Ocorreu um erro ao criar o usuário.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasPermission) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-gray-500 dark:text-gray-400">
          Você não tem permissão para acessar esta área.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/planejamento/usuarios">
          <button className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800">
            <ChevronLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-400" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Novo usuário
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Cadastre um usuário subordinado e envie as credenciais
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Label>
                Nome <span className="text-error-500">*</span>
              </Label>
              <Input
                placeholder="Nome completo"
                type="text"
                {...register("nome")}
                error={errors.nome?.message}
              />
            </div>
            <div>
              <Label>
                E-mail <span className="text-error-500">*</span>
              </Label>
              <Input
                placeholder="email@dominio.com"
                type="email"
                {...register("email")}
                error={errors.email?.message}
              />
            </div>
            <div>
              <Label>
                Tipo de usuário <span className="text-error-500">*</span>
              </Label>
              <Select
                options={userTypeOptions}
                placeholder={isLoadingTypes ? "Carregando tipos..." : "Selecione o tipo"}
                value={userType}
                onChange={(value) => {
                  setUserType(value);
                  setTurmaId("");
                  setProfessorId("");
                  setFilhosInput("");
                }}
              />
              {userType && (
                <p className="mt-1 text-xs text-gray-500">
                  Tipo selecionado:{" "}
                  {profileLabels[userType] ||
                    USER_TYPE_LABELS[userType] ||
                    userType}
                </p>
              )}
            </div>
            {!isDiretor && (
              <div>
                <Label>
                  Escola <span className="text-error-500">*</span>
                </Label>
                <Select
                  key={schoolId || "escola"}
                  options={schoolOptions}
                  placeholder="Selecione a escola"
                  defaultValue={schoolId}
                  onChange={(value) => setSchoolId(value)}
                  disabled
                  className={!schoolOptions.length ? "opacity-60" : ""}
                />
                {!schoolOptions.length && (
                  <p className="mt-1 text-xs text-gray-500">
                    Nenhuma escola disponível para seleção.
                  </p>
                )}
              </div>
            )}
            {isDiretor && (
              <div>
                <Label>Escola</Label>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {selectedSchool?.nome || "Não informado"}
                </div>
              </div>
            )}

            {userType === "aluno" && (
              <div className="md:col-span-2">
                <Label>Turma</Label>
                <Select
                  key={turmaId || "turma"}
                  options={turmaOptions}
                  placeholder={
                    isLoadingRelations
                      ? "Carregando turmas..."
                      : "Selecione a turma"
                  }
                  defaultValue={turmaId}
                  onChange={(value) => setTurmaId(value)}
                  className={isLoadingRelations ? "opacity-60" : ""}
                />
              </div>
            )}

            {userType === "professor" && (
              <div className="md:col-span-2">
                <Label>Professor vinculado</Label>
                <Select
                  key={professorId || "professor"}
                  options={professorOptions}
                  placeholder={
                    isLoadingRelations
                      ? "Carregando professores..."
                      : "Selecione o professor"
                  }
                  defaultValue={professorId}
                  onChange={(value) => setProfessorId(value)}
                  className={isLoadingRelations ? "opacity-60" : ""}
                />
              </div>
            )}

            {(userType === "pai" ||
              userType === "mae" ||
              userType === "responsavel") && (
              <div className="md:col-span-2">
                <Label>Filhos (IDs de usuários)</Label>
                <Input
                  placeholder="Informe os IDs separados por vírgula"
                  type="text"
                  value={filhosInput}
                  onChange={(e) => setFilhosInput(e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Exemplo: 64a1..., 64b2...
                </p>
              </div>
            )}
            {!!availablePermissions.length && (
              <div className="md:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Label>Permissões</Label>
                  <button
                    type="button"
                    className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                    onClick={handleSelectAllPermissions}
                  >
                    Selecionar todas
                  </button>
                </div>
                <div className="mt-3 space-y-6">
                  {permissionGroups.map((group) => (
                    <div key={group.resource}>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {formatResourceLabel(group.resource)}
                      </p>
                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                        {group.permissions.map((permission) => (
                          <Checkbox
                            key={permission}
                            label={formatPermissionLabel(permission)}
                            checked={selectedPermissions.includes(permission)}
                            onChange={() => togglePermission(permission)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Selecione as permissões específicas para o usuário.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button type="submit" size="sm" disabled={isSubmitting || !userType}>
            {isSubmitting ? "Salvando..." : "Criar usuário"}
          </Button>
          <Link href="/planejamento/usuarios">
            <Button variant="outline" size="sm" type="button">
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
