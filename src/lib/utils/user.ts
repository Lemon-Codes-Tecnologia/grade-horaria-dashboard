export const USER_TYPE_LABELS: Record<string, string> = {
  admin: "Administrador",
  administrador: "Administrador",
  suporte: "Suporte",
  diretor: "Diretor",
  coordenador: "Coordenador",
  secretario: "Secretário",
  professor: "Professor",
  pai: "Pai",
  mae: "Mãe",
  responsavel: "Responsável",
  aluno: "Aluno",
};

export const USER_TYPE_OPTIONS = [
  { value: "coordenador", label: "Coordenador" },
  { value: "secretario", label: "Secretário" },
  { value: "professor", label: "Professor" },
  { value: "pai", label: "Pai" },
  { value: "mae", label: "Mãe" },
  { value: "responsavel", label: "Responsável" },
  { value: "aluno", label: "Aluno" },
];

export const PERMISSION_LABELS: Record<string, string> = {
  "usuarios:list": "Listar usuários",
  "usuarios:write": "Cadastrar usuários",
  "usuarios:read": "Ver detalhes de usuários",
  "usuarios:update": "Editar usuários",
  "usuarios:delete": "Excluir usuários",
  "mural:list": "Listar mural",
  "mural:write": "Publicar no mural",
  "mural:read": "Ver mural",
  "mural:update": "Editar mural",
  "mural:delete": "Excluir mural",
  "grade:list": "Listar grades",
  "grade:write": "Cadastrar grades",
  "grade:read": "Ver grades",
  "grade:update": "Editar grades",
  "grade:delete": "Excluir grades",
  "escola:list": "Listar escolas",
  "escola:write": "Cadastrar escolas",
  "escola:read": "Ver detalhes de escolas",
  "escola:update": "Editar escolas",
  "escola:delete": "Excluir escolas",
  "disciplina:list": "Listar disciplinas",
  "disciplina:write": "Cadastrar disciplinas",
  "disciplina:read": "Ver detalhes de disciplinas",
  "disciplina:update": "Editar disciplinas",
  "disciplina:delete": "Excluir disciplinas",
  "turma:list": "Listar turmas",
  "turma:write": "Cadastrar turmas",
  "turma:read": "Ver detalhes de turmas",
  "turma:update": "Editar turmas",
  "turma:delete": "Excluir turmas",
};

export const formatPermissionLabel = (permission: string) =>
  PERMISSION_LABELS[permission] || permission;

const PERMISSION_ACTION_ORDER = ["list", "read", "write", "update", "delete"];

export const sortPermissions = (permissions: string[]) => {
  const actionIndex = (action?: string) => {
    if (!action) return PERMISSION_ACTION_ORDER.length + 1;
    const idx = PERMISSION_ACTION_ORDER.indexOf(action);
    return idx === -1 ? PERMISSION_ACTION_ORDER.length + 1 : idx;
  };

  return [...permissions].sort((a, b) => {
    const [aResource = "", aAction = ""] = a.split(":");
    const [bResource = "", bAction = ""] = b.split(":");
    if (aResource !== bResource) {
      return aResource.localeCompare(bResource);
    }
    const actionDiff = actionIndex(aAction) - actionIndex(bAction);
    if (actionDiff !== 0) return actionDiff;
    return a.localeCompare(b);
  });
};

const MANAGE_USER_TYPES = new Set([
  "administrador",
  "admin",
  "suporte",
  "diretor",
  "coordenador",
]);

export const canManageUsers = (tipo?: string) =>
  !!tipo && MANAGE_USER_TYPES.has(tipo);

export const isAdmin = (tipo?: string) =>
  tipo === "administrador" || tipo === "admin";

export const isSupport = (tipo?: string) => tipo === "suporte";

export const isDirector = (tipo?: string) => tipo === "diretor";

export const isCoordinator = (tipo?: string) => tipo === "coordenador";

export const formatUserType = (tipo?: string) => {
  if (!tipo) return "-";
  return USER_TYPE_LABELS[tipo] || tipo;
};

export const mapUserTypesToOptions = (types: string[]) =>
  types.map((tipo) => ({
    value: tipo,
    label: USER_TYPE_LABELS[tipo] || tipo,
  }));

export const isSupportRestrictedTarget = (
  actorTipo?: string,
  targetTipo?: string
) => isSupport(actorTipo) && isAdmin(targetTipo);

export const isCoordinatorAllowedType = (tipo?: string) =>
  !!tipo &&
  new Set(["professor", "secretario", "aluno", "pai", "mae", "responsavel"]).has(
    tipo
  );

export const isCoordinatorRestrictedTarget = (
  actorTipo?: string,
  targetTipo?: string
) => isCoordinator(actorTipo) && !isCoordinatorAllowedType(targetTipo);
