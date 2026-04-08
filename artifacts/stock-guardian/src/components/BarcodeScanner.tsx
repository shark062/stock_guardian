import { useEffect, useRef, useState } from "react";
import { Camera, X, Loader2 } from "lucide-react";

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const scannerInstanceRef = useRef<any>(null);
  const [status, setStatus] = useState<"loading" | "running" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let mounted = true;

    async function initScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");

        if (!mounted || !scannerRef.current) return;

        const scanner = new Html5Qrcode("barcode-reader");
        scannerInstanceRef.current = scanner;

        const devices = await Html5Qrcode.getCameras();
        if (!devices || devices.length === 0) {
          setErrorMsg("Nenhuma câmera encontrada.");
          setStatus("error");
          return;
        }

        const backCamera = devices.find(
          (d) =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("tras") ||
            d.label.toLowerCase().includes("rear") ||
            d.label.toLowerCase().includes("environment")
        );
        const cameraId = backCamera ? backCamera.id : devices[devices.length - 1].id;

        await scanner.start(
          cameraId,
          { fps: 10, qrbox: { width: 260, height: 160 } },
          (decodedText) => {
            if (mounted) {
              onDetected(decodedText);
              scanner.stop().catch(() => {});
            }
          },
          () => {}
        );

        if (mounted) setStatus("running");
      } catch (err: any) {
        if (mounted) {
          const msg =
            err?.message?.includes("NotAllowed") || err?.name === "NotAllowedError"
              ? "Permissão de câmera negada. Permita o acesso nas configurações do navegador."
              : err?.message ?? "Erro ao iniciar câmera.";
          setErrorMsg(msg);
          setStatus("error");
        }
      }
    }

    initScanner();

    return () => {
      mounted = false;
      if (scannerInstanceRef.current) {
        scannerInstanceRef.current.stop().catch(() => {});
        scannerInstanceRef.current.clear();
      }
    };
  }, [onDetected]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">Scanner de Código de Barras</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4">
          {status === "loading" && (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Iniciando câmera...</p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center py-8 gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Camera className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-sm text-red-600 font-medium">{errorMsg}</p>
              <p className="text-xs text-muted-foreground">
                Você pode digitar o código manualmente no campo abaixo.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-4 py-2 text-sm rounded-lg bg-muted hover:bg-muted/80 transition-colors cursor-pointer font-medium"
              >
                Fechar scanner
              </button>
            </div>
          )}

          <div
            id="barcode-reader"
            ref={scannerRef}
            className={status !== "running" ? "hidden" : "rounded-xl overflow-hidden"}
            style={{ width: "100%" }}
          />

          {status === "running" && (
            <p className="text-xs text-muted-foreground text-center mt-3">
              Aponte a câmera para o código de barras do produto
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
