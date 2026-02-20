import { isWin } from "./config";
import { execSync } from "node:child_process";

export function detectVirtualMachine(): boolean {
    if (!isWin) return false;

    try {
        const output = execSync('powershell.exe -Command "Get-CimInstance -ClassName Win32_ComputerSystem | Select-Object -ExpandProperty Model; Get-CimInstance -ClassName Win32_ComputerSystem | Select-Object -ExpandProperty Manufacturer"', { encoding: 'utf-8' }).toLowerCase();
        const vmKeywords = ["vmware", "virtualbox", "hyper-v", "qemu", "xen", "innotek", "microsoft corporation"];

        for (const keyword of vmKeywords) {
            if (output.includes(keyword)) {
                console.error(`🚨 ALERTA: Ejecución en Máquina Virtual detectada (${keyword}). Emulación bloqueada.`);
                return true;
            }
        }
        return false;
    } catch (e) {
        console.error("⚠️ No se pudo verificar la entidad del sistema (VM Check failed).");
        return false;
    }
}

export function detectMultipleMonitors(): boolean {
    if (!isWin) return false;

    try {
        // Obtenemos los monitores activos físicos
        const output = execSync('powershell.exe -Command "@(Get-CimInstance -Namespace root\\wmi -ClassName WmiMonitorBasicDisplayParams).Count"', { encoding: 'utf-8' }).trim();
        const count = parseInt(output, 10);

        if (count > 1) {
            console.error(`🚨 ALERTA: Múltiples monitores detectados (${count}). El examen solo permite 1 pantalla.`);
            return true;
        }
        return false;
    } catch (e) {
        // Fallback por si WmiMonitorBasicDisplayParams falla
        return false;
    }
}

let clipboardInterval: Timer;

export function startClipboardAnnihilator() {
    console.log("✂️ Activando aniquilador de portapapeles...");
    clipboardInterval = setInterval(() => {
        if (isWin) {
            Bun.spawn(["cmd", "/c", "echo off | clip"]);
        } else {
            // Placeholder para linux/mac, requiere xclip o pbcopy
        }
    }, 1000);
}

export function stopClipboardAnnihilator() {
    if (clipboardInterval) {
        clearInterval(clipboardInterval);
    }
}



