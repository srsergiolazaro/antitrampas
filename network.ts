import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { HOSTS_PATH, HOSTS_BACKUP, BLOCKED_DOMAINS, isWin } from "./config";

export function checkPrivileges() {
    try {
        writeFileSync(HOSTS_PATH, "", { flag: "a" });
    } catch (e) {
        console.error("❌ ERROR: Este centinela debe ejecutarse como Administrador/Root.");
        process.exit(1);
    }
}

export function manageNetwork(block: boolean) {
    if (block) {
        console.log("🔒 Bloqueando red y creando backup de hosts...");
        if (!existsSync(HOSTS_BACKUP)) copyFileSync(HOSTS_PATH, HOSTS_BACKUP);

        let hostsContent = readFileSync(HOSTS_PATH, "utf-8");
        let injectedRules = "\n# --- EXAM GUARD START ---\n";
        BLOCKED_DOMAINS.forEach(domain => {
            injectedRules += `0.0.0.0 ${domain}\n0.0.0.0 www.${domain}\n`;
        });
        injectedRules += "# --- EXAM GUARD END ---\n";

        writeFileSync(HOSTS_PATH, hostsContent + injectedRules);
    } else {
        console.log("🔓 Restaurando red...");
        if (existsSync(HOSTS_BACKUP)) {
            copyFileSync(HOSTS_BACKUP, HOSTS_PATH);
            Bun.spawnSync(isWin ? ["cmd", "/c", "del", HOSTS_BACKUP] : ["rm", HOSTS_BACKUP]);
        }
    }
}
