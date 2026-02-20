import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { HOSTS_PATH, HOSTS_BACKUP, BLOCKED_DOMAINS, isWin } from "./config";

let hasAdmin = false;

export function checkPrivileges(): boolean {
    try {
        writeFileSync(HOSTS_PATH, "", { flag: "a" });
        hasAdmin = true;
        return true;
    } catch (e) {
        hasAdmin = false;
        console.warn("⚠️ AVISO: El Agente no se está ejecutando como Administrador.");
        console.warn("   -> El bloqueo estricto de red (Archivo Hosts) estará desactivado.");
        console.warn("   -> Sin embargo, el examen puede continuar. La detección de foco de la web sigue activa.");
        return false;
    }
}

export function manageNetwork(block: boolean) {
    if (!hasAdmin) return; // Si no hay permisos, abortar silenciosamente

    if (block) {
        console.log("🔒 Bloqueando red y creando backup de hosts...");
        try {
            if (!existsSync(HOSTS_BACKUP)) copyFileSync(HOSTS_PATH, HOSTS_BACKUP);

            let hostsContent = readFileSync(HOSTS_PATH, "utf-8");
            let injectedRules = "\n# --- EXAM GUARD START ---\n";
            BLOCKED_DOMAINS.forEach(domain => {
                injectedRules += `0.0.0.0 ${domain}\n0.0.0.0 www.${domain}\n`;
            });
            injectedRules += "# --- EXAM GUARD END ---\n";

            writeFileSync(HOSTS_PATH, hostsContent + injectedRules);
        } catch (e) {
            console.error("❌ Fallo al bloquear red, permisos insuficientes.");
        }
    } else {
        console.log("🔓 Restaurando red...");
        try {
            if (existsSync(HOSTS_BACKUP)) {
                copyFileSync(HOSTS_BACKUP, HOSTS_PATH);
                Bun.spawnSync(isWin ? ["cmd", "/c", "del", HOSTS_BACKUP] : ["rm", HOSTS_BACKUP]);
            }
        } catch (e) {
            console.error("❌ Fallo al restaurar red.");
        }
    }
}
