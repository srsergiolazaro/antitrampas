import { checkPrivileges, manageNetwork } from "./network";
import { killForbiddenProcesses } from "./processes";
import { startServer } from "./server";
import { PORT, EXAM_URL } from "./config";
import { detectVirtualMachine, detectMultipleMonitors, startClipboardAnnihilator, stopClipboardAnnihilator } from "./system-checks";
import { listenForDevExit } from "./dev-mode";

async function monitorLoop() {
    await killForbiddenProcesses();
    setTimeout(monitorLoop, 1000);
}

async function bootstrap() {
    console.log("🚀 Iniciando Integrity Agent (Hardened & Orchestrated)...");

    // Iniciar servidor local (WS Hub y Archivos Estáticos)
    startServer();

    console.log(`✅ Companion Agent activo y protegiendo el OS. Escuchando en http://localhost:${PORT}`);
}

// Limpieza elegante
export function cleanup() {
    manageNetwork(false);
    stopClipboardAnnihilator();
}

process.on("SIGINT", () => {
    console.log("\n⚠️ Cierre forzado detectado. Limpiando entorno...");
    cleanup();
    process.exit(0);
});

process.on("exit", () => cleanup());
process.on("uncaughtException", (err) => {
    console.error("💥 Error no capturado:", err);
    cleanup();
    process.exit(1);
});

bootstrap();