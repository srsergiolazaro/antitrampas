import { FORBIDDEN_APPS, isWin } from "./config";

export async function killForbiddenProcesses() {
    const cmd = isWin ? ["tasklist"] : ["ps", "aux"];

    try {
        const proc = Bun.spawn(cmd, {
            stdout: "pipe",
            stderr: "pipe"
        });

        const output = (await new Response(proc.stdout).text()).toLowerCase();

        for (const app of FORBIDDEN_APPS) {
            if (output.includes(app)) {
                console.log(`☠️ Infracción detectada: ${app}. Aniquilando proceso...`);
                if (isWin) {
                    Bun.spawn(["taskkill", "/F", "/IM", `${app}.exe`, "/T"]);
                } else {
                    Bun.spawn(["pkill", "-9", "-i", "-f", app]);
                }
            }
        }
    } catch (err) {
        console.error("❌ Error escaneando procesos:", err);
    }
}
