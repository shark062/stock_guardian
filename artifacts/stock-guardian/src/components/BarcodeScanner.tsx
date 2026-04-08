import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, X, Loader2, FlipHorizontal, UploadCloud, AlertCircle } from "lucide-react";

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
  onClose: () => void;
}

type Status = "loading" | "running" | "error";
type FacingMode = "environment" | "user";

export function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [facing, setFacing] = useState<FacingMode>("environment");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);

  const stopScanner = useCallback(async () => {
    if (instanceRef.current) {
      try {
        const state = instanceRef.current.getState?.();
        if (state === 2) {
          await instanceRef.current.stop();
        }
        instanceRef.current.clear?.();
      } catch {}
      instanceRef.current = null;
    }
  }, []);

  const startScanner = useCallback(
    async (facingMode: FacingMode) => {
      if (!mountedRef.current) return;
      setStatus("loading");
      setErrorMsg("");

      await stopScanner();

      try {
        const { Html5Qrcode } = await import("html5-qrcode");

        if (!mountedRef.current || !scannerRef.current) return;

        const elementId = "barcode-reader-" + Date.now();
        if (scannerRef.current) {
          scannerRef.current.id = elementId;
        }

        const scanner = new Html5Qrcode(elementId);
        instanceRef.current = scanner;

        await scanner.start(
          { facingMode: { ideal: facingMode } },
          {
            fps: 15,
            qrbox: { width: 260, height: 120 },
            aspectRatio: 1.5,
            disableFlip: false,
          },
          (decodedText: string) => {
            if (mountedRef.current) {
              onDetected(decodedText);
              stopScanner();
            }
          },
          () => {}
        );

        if (mountedRef.current) setStatus("running");
      } catch (err: any) {
        if (!mountedRef.current) return;

        const message: string = err?.message ?? "";
        const name: string = err?.name ?? "";

        let msg = "Não foi possível acessar a câmera.";

        if (name === "NotAllowedError" || message.includes("NotAllowed") || message.includes("Permission")) {
          msg = "Permissão de câmera negada. Toque no ícone de cadeado na barra de endereço e permita o acesso à câmera.";
        } else if (name === "NotFoundError" || message.includes("NotFound") || message.includes("not found")) {
          msg = "Nenhuma câmera encontrada neste dispositivo.";
        } else if (name === "NotReadableError" || message.includes("NotReadable")) {
          msg = "A câmera está em uso por outro aplicativo. Feche outros apps e tente novamente.";
        } else if (message.includes("https") || message.includes("secure") || message.includes("insecure")) {
          msg = "A câmera só funciona em conexões seguras (HTTPS). Use a câmera traseira ou envie uma foto.";
        }

        setErrorMsg(msg);
        setStatus("error");
      }
    },
    [onDetected, stopScanner]
  );

  useEffect(() => {
    mountedRef.current = true;
    startScanner("environment");

    return () => {
      mountedRef.current = false;
      stopScanner();
    };
  }, []);

  const handleFlip = () => {
    const next: FacingMode = facing === "environment" ? "user" : "environment";
    setFacing(next);
    startScanner(next);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      Html5Qrcode.scanFile(file, true)
        .then((code: string) => {
          onDetected(code);
        })
        .catch(() => {
          setErrorMsg("Não foi possível ler o código nessa imagem. Tente uma foto mais nítida e centralizada.");
          setStatus("error");
        });
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">Escanear Código de Barras</h3>
          </div>
          <div className="flex items-center gap-1">
            {status === "running" && (
              <button
                onClick={handleFlip}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                title="Trocar câmera"
              >
                <FlipHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            <button
              onClick={() => { stopScanner(); onClose(); }}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {status === "loading" && (
            <div className="flex flex-col items-center py-10 gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Iniciando câmera...</p>
              <p className="text-xs text-muted-foreground text-center">
                Se solicitado, permita o acesso à câmera
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center py-6 gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-sm text-red-600 font-medium leading-snug px-2">{errorMsg}</p>

              <button
                onClick={() => startScanner(facing)}
                className="mt-1 px-4 py-2 text-sm rounded-lg font-semibold transition-colors cursor-pointer"
                style={{ backgroundColor: "hsl(40, 54%, 54%)", color: "hsl(220, 73%, 12%)" }}
              >
                Tentar novamente
              </button>
            </div>
          )}

          <div
            ref={scannerRef}
            id="barcode-reader"
            className="rounded-xl overflow-hidden"
            style={{
              width: "100%",
              display: status === "running" ? "block" : "none",
            }}
          />

          {status === "running" && (
            <div className="text-center space-y-1">
              <p className="text-xs text-muted-foreground">
                Aponte para o código de barras — detecção automática
              </p>
              <p className="text-[10px] text-muted-foreground">
                Câmera: {facing === "environment" ? "Traseira" : "Frontal"}
              </p>
            </div>
          )}

          <div className="border-t border-border pt-3">
            <p className="text-[11px] text-muted-foreground text-center mb-2">
              Ou envie uma foto do código de barras
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 border border-dashed border-border rounded-xl text-xs text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              Carregar imagem com código de barras
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
