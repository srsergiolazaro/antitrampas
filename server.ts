import { PORT, EXAM_TOKEN, AGENT_SECRET } from "./config";
import { createHmac } from "node:crypto";
import { startScreenRecording, stopScreenRecording } from "./recorder";
import { detectVirtualMachine, detectMultipleMonitors, startClipboardAnnihilator, stopClipboardAnnihilator } from "./system-checks";
import { manageNetwork } from "./network";
import { killForbiddenProcesses } from "./processes";
import { listenForDevExit } from "./dev-mode";

let monitorInterval: Timer | null = null;
let examInProgress = false;

export function startServer() {
    return Bun.serve({
        port: PORT,
        async fetch(req, server) {
            const url = new URL(req.url);

            // Manejar Upgrade a WebSocket
            if (url.pathname === "/ws") {
                const upgraded = server.upgrade(req);
                if (!upgraded) {
                    return new Response("Upgrade failed", { status: 400 });
                }
                return undefined;
            }

            // Si piden un archivo de la carpeta public (ejm: /exam.html)
            if (url.pathname !== "/" && !url.pathname.startsWith("/api")) {
                const filePath = `./public${url.pathname}`;
                const file = Bun.file(filePath);
                if (await file.exists()) {
                    return new Response(file);
                }
            }

            return new Response("Agent is active and listening for WebSockets.");
        },
        websocket: {
            open(ws) {
                console.log("🔌 Frontend (Página del Examen) conectado al Companion Agent.");
            },
            async message(ws, message) {
                try {
                    const data = JSON.parse(message as string);

                    if (data.event === "EXAM_STARTED") {
                        console.log("🟢 Examen Iniciado. Activando Lockdown de OS...");
                        examInProgress = true;

                        // Controles pre-vuelo: Bloquear si hay VM o Multimonitor
                        if (detectVirtualMachine() || detectMultipleMonitors()) {
                            ws.send(JSON.stringify({ event: "SYSTEM_REJECTED", reason: "Entorno no cumple con los requisitos." }));
                            return;
                        }

                        // Empezar a cortar el sistema
                        manageNetwork(true);
                        startClipboardAnnihilator();
                        listenForDevExit(); // Solo si está activo

                        // Bucle constante matando trampas
                        monitorInterval = setInterval(async () => {
                            await killForbiddenProcesses();
                        }, 1000);

                        ws.send(JSON.stringify({ event: "AGENT_LOCKED_DOWN" }));
                    }

                    if (data.event === "CHEATING_DETECTED") {
                        console.log(`\n🚨 [${new Date().toISOString()}] INCIDENTE DE INTEGRIDAD DETECTADO DESDE EL FRONTEND:`);
                        console.log(`   Motivo: ${data.reason}`);

                        // Encendemos FFmpeg al instante
                        startScreenRecording(data.reason);
                    }

                    if (data.event === "EXAM_FINISHED") {
                        console.log("🏁 Examen Terminado de forma segura. Liberando OS...");
                        cleanupAgent();
                    }

                } catch (e) {
                    console.error("Error parseando mensaje WS", e);
                }
            },
            close(ws, code, message) {
                console.log("🔌 Frontend desconectado.");
                if (examInProgress) {
                    console.log("⚠️ El estudiante cerró la pestaña del examen abruptamente. Generando reporte final y limpiando...");
                    // Podríamos grabar también aquí como evidencia final
                    startScreenRecording("Cierre abrupto de la pestaña maestra");
                    cleanupAgent();
                }
            }
        }
    });
}

// Limpieza del Agente
export function cleanupAgent() {
    examInProgress = false;
    manageNetwork(false);
    stopClipboardAnnihilator();
    if (monitorInterval) clearInterval(monitorInterval);
}
