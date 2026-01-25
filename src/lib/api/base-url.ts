const DEFAULT_API_URL = "https://grade-horaria-api-c21a7f69ca18.herokuapp.com";
const ENV_API_URL = process.env.NEXT_PUBLIC_API_URL;

export const API_BASE_URL = (ENV_API_URL ?? DEFAULT_API_URL).replace(/\/+$/, "");
