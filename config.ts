import { platform } from "node:os";

export const PORT = 3333;
export const DEV_MODE = true; // Activa el shortcut de desarrollo para emergencias
export const EXAM_TOKEN = "locus_secure_" + Bun.hash("exam_secret_seed").toString();
// En un entorno real, este secreto se pasaría por variable de entorno o argumento
export const AGENT_SECRET = "top_secret_agent_signature_key";
export const EXAM_URL = `http://localhost:${PORT}/exam.html`; // Cambiar por la URL real del examen
export const FORBIDDEN_APPS = ["discord", "slack", "skype", "teamviewer", "anydesk", "obs", "taskmgr", "snippingtool", "screenclippinghost", "bcastdvr", "gamebar"];
export const BLOCKED_DOMAINS = ["chatgpt.com", "openai.com", "stackoverflow.com", "gemini.google.com", "claude.ai"];

export const isWin = platform() === "win32";
export const HOSTS_PATH = isWin ? "C:\\Windows\\System32\\drivers\\etc\\hosts" : "/etc/hosts";
export const HOSTS_BACKUP = `${HOSTS_PATH}.bak`;
