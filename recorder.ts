import { spawn, ChildProcess } from "node:child_process";
import { join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";

export const EVIDENCES_DIR = join(process.cwd(), "evidencias");

let currentRecordingProcess: ChildProcess | null = null;
let recordingTimeout: Timer | null = null;

// Verifica si FFmpeg existe globalmente
export function checkFFmpegExists(): boolean {
    try {
        const proc = Bun.spawnSync(["ffmpeg", "-version"]);
        return proc.exitCode === 0;
    } catch {
        return false;
    }
}

export function startScreenRecording(reason: string) {
    if (!checkFFmpegExists()) {
        console.error("❌ FFmpeg no está instalado en el sistema. No se puede grabar el escritorio.");
        console.log("👉 Por favor instala FFmpeg y agrégalo al PATH de Windows.");
        return;
    }

    if (!existsSync(EVIDENCES_DIR)) {
        mkdirSync(EVIDENCES_DIR, { recursive: true });
    }

    if (currentRecordingProcess) {
        // Ya estamos grabando un incidente
        return;
    }

    const timestamp = Date.now();
    const filename = `trampa_${timestamp}.mp4`;
    const outputPath = join(EVIDENCES_DIR, filename);

    console.log(`🎥 INICIANDO GRABACIÓN DE EVIDENCIA: ${reason}`);
    console.log(`Guardando en: ${outputPath}`);

    // Capturar el escritorio completo de Windows usando gdigrab (con bajo frame rate para no afectar examen)
    currentRecordingProcess = spawn("ffmpeg", [
        "-y",
        "-f", "gdigrab",
        "-framerate", "5",
        "-i", "desktop",
        "-c:v", "libx264",
        "-preset", "ultrafast",   // Máximo rendimiento
        "-pix_fmt", "yuv420p",
        outputPath
    ]);

    currentRecordingProcess.on("error", (err) => {
        console.error("❌ Error grabando ventana:", err);
        currentRecordingProcess = null;
    });

    currentRecordingProcess.stderr!.on("data", (data) => {
        // FFmpeg imprime su progreso en stderr, no lo mostramos para no ensuciar la consola, 
        // pero se podría descomentar para debugging
    });

    // Detener la grabación automáticamente después de 30 segundos
    recordingTimeout = setTimeout(() => {
        stopScreenRecording();
    }, 30000);
}

export function stopScreenRecording() {
    if (currentRecordingProcess) {
        console.log("⏹️ Deteniendo grabación de evidencia...");
        currentRecordingProcess.stdin?.write("q\n"); // Comando elegante de salida nativo para FFmpeg
        currentRecordingProcess = null;
    }

    if (recordingTimeout) {
        clearTimeout(recordingTimeout);
        recordingTimeout = null;
    }
}
