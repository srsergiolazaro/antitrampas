import { spawn } from "node:child_process";
import { isWin, DEV_MODE } from "./config";
import { cleanup } from "./index";

export function listenForDevExit() {
    if (!isWin || !DEV_MODE) return;

    console.log("🛠️ Dev Mode Activo: Escuchando Ctrl + T para salida de emergencia global.");

    const psScript = `
$signature = @"
using System;
using System.Runtime.InteropServices;
public class Keyboard {
    [DllImport("user32.dll")]
    public static extern short GetAsyncKeyState(int vKey);
}
"@;
Add-Type -TypeDefinition $signature -Name "Keyboard" -Namespace "Win32";
while($true) {
    if (([Win32.Keyboard]::GetAsyncKeyState(0x11) -band 0x8000) -and ([Win32.Keyboard]::GetAsyncKeyState(0x54) -band 0x8000)) {
        Write-Output "DEV_EXIT";
        exit;
    }
    Start-Sleep -Milliseconds 100;
}
`;

    const child = spawn("powershell.exe", ["-NoProfile", "-Command", psScript]);

    child.stdout.on("data", (data) => {
        if (data.toString().includes("DEV_EXIT")) {
            console.log("\n🚨 DEV MODE TRIGGER: Atajo Ctrl+T detectado. Abortando misión...");
            cleanup();
            process.exit(0);
        }
    });

    // Timeout de 30 segundos
    setTimeout(() => {
        console.log("\n⏳ DEV MODE: Han pasado 30 segundos. Restaurando el entorno automáticamente para evitar bloqueos prolongados...");
        cleanup();
        process.exit(0);
    }, 30000);

    child.on("error", (err) => {
        console.error("⚠️ Error en el listener de Dev Mode:", err);
    });
}
