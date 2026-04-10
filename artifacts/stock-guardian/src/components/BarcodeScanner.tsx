import { useEffect, useRef, useState, useCallback } from "react";
import {
  Camera,
  X,
  Loader2,
  UploadCloud,
  Keyboard,
  CheckCircle2,
  AlertCircle,
  ScanLine,
} from "lucide-react";

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
  onClose: () => void;
}

type Mode = "camera" | "file" | "manual";

declare global {
  interface Window {
    BarcodeDetector?: any;
  }
}

export function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const detectorRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>("camera");
  const [camStatus, setCamStatus] = useState<"starting" | "running" | "error">("starting");
  const [camError, setCamError] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [fileError, setFileError] = useState("");
  const [fileOk, setFileOk] = useState("");
  const [scanning, setScanning] = useState(false);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    setCamStatus("starting");
    setCamError("");
    stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      // Attach stream to video element — it must exist in DOM already
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play().catch(() => {});
        };
      }

      let detector: any = null;
      if (window.BarcodeDetector) {
        try {
          detector = new window.BarcodeDetector({
            formats: [
              "ean_13", "ean_8", "code_128", "code_39", "code_93",
              "qr_code", "upc_a", "upc_e", "data_matrix", "itf",
            ],
          });
          detectorRef.current = detector;
        } catch {}
      }

      setCamStatus("running");

      const tick = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        const v = videoRef.current;
        if (v.readyState < 2 || v.videoWidth === 0) {
          animFrameRef.current = requestAnimationFrame(tick);
          return;
        }

        const canvas = canvasRef.current;
        canvas.width = v.videoWidth;
        canvas.height = v.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(v, 0, 0);

        if (detector) {
          try {
            const results = await detector.detect(canvas);
            if (results && results.length > 0) {
              const code = results[0].rawValue as string;
              if (code) {
                stopCamera();
                onDetected(code);
                return;
              }
            }
          } catch {}
        }

        animFrameRef.current = requestAnimationFrame(tick);
      };

      animFrameRef.current = requestAnimationFrame(tick);
    } catch (err: any) {
      const name: string = err?.name ?? "";
      const msg: string = err?.message ?? "";

      if (name === "NotAllowedError" || msg.includes("NotAllowed")) {
        setCamError(
          "Câmera bloqueada. Toque no ícone de cadeado 🔒 na barra do navegador → Câmera → Permitir. Depois toque em 'Tentar novamente'."
        );
      } else if (name === "NotFoundError" || msg.includes("NotFound")) {
        setCamError("Nenhuma câmera encontrada. Use a opção de foto ou digite o código.");
      } else if (name === "NotReadableError" || msg.includes("NotReadable")) {
        setCamError("Câmera em uso por outro aplicativo. Feche outros apps e tente novamente.");
      } else {
        setCamError(`Erro ao acessar câmera: ${msg || name || "desconhecido"}.`);
      }

      setCamStatus("error");
    }
  }, [onDetected, stopCamera]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError("");
    setFileOk("");
    setScanning(true);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const code = await Html5Qrcode.scanFile(file, false);
      if (code) {
        setFileOk(code);
        setTimeout(() => {
          onDetected(code);
        }, 600);
      }
    } catch {
      setFileError("Não foi possível ler o código nesta imagem. Tente uma foto mais nítida e centralizada sobre o código.");
    } finally {
      setScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleManual = () => {
    const code = manualCode.trim();
    if (code.length < 3) return;
    onDetected(code);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const hasBarcodeDetector = typeof window !== "undefined" && !!window.BarcodeDetector;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScanLine className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">Leitor de Código de Barras</h3>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex border-b border-border">
          {(
            [
              { key: "camera", label: "Câmera", icon: Camera },
              { key: "file", label: "Foto", icon: UploadCloud },
              { key: "manual", label: "Manual", icon: Keyboard },
            ] as { key: Mode; label: string; icon: React.ElementType }[]
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                if (tab.key !== "camera") stopCamera();
                if (tab.key === "camera") startCamera();
                setMode(tab.key);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors cursor-pointer border-b-2 ${
                mode === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {mode === "camera" && (
            <div className="space-y-3">
              {/* Video always mounted so ref is available when stream arrives */}
              <div
                className="relative rounded-xl overflow-hidden bg-black"
                style={{
                  aspectRatio: "4/3",
                  display: camStatus === "running" ? "block" : "none",
                }}
              >
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-primary/80 rounded-lg w-56 h-24 relative">
                    <div className="absolute -top-0.5 -left-0.5 w-4 h-4 border-t-4 border-l-4 border-primary rounded-tl" />
                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 border-t-4 border-r-4 border-primary rounded-tr" />
                    <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 border-b-4 border-l-4 border-primary rounded-bl" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 border-b-4 border-r-4 border-primary rounded-br" />
                    <div
                      className="absolute left-0 right-0 h-0.5 bg-primary/70"
                      style={{ animation: "scan-line 2s linear infinite", top: "50%" }}
                    />
                  </div>
                </div>
                {!hasBarcodeDetector && (
                  <div className="absolute bottom-2 left-2 right-2 bg-black/60 text-white text-[10px] rounded px-2 py-1 text-center">
                    Câmera ativa — detecção automática indisponível neste navegador
                  </div>
                )}
              </div>

              {camStatus === "starting" && (
                <div className="flex flex-col items-center py-8 gap-3">
                  <Loader2 className="w-7 h-7 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground text-center">Iniciando câmera...</p>
                  <p className="text-xs text-muted-foreground text-center">
                    Se aparecer uma solicitação de permissão, toque em <strong>Permitir</strong>
                  </p>
                </div>
              )}

              {camStatus === "error" && (
                <div className="flex flex-col items-center py-5 gap-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  </div>
                  <p className="text-sm text-red-600 leading-snug px-1">{camError}</p>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer"
                    style={{ backgroundColor: "hsl(40, 54%, 54%)", color: "hsl(220, 73%, 12%)" }}
                  >
                    Tentar novamente
                  </button>
                  <p className="text-xs text-muted-foreground">
                    Ou use as abas <strong>Foto</strong> ou <strong>Manual</strong> acima
                  </p>
                </div>
              )}

              {camStatus === "running" && (
                <>
                  <p className="text-xs text-muted-foreground text-center">
                    Aponte o código de barras para dentro da moldura
                    {hasBarcodeDetector ? " — detecção automática ativa" : ""}
                  </p>
                  {!hasBarcodeDetector && (
                    <p className="text-xs text-amber-600 text-center bg-amber-50 rounded-lg px-3 py-2">
                      Seu navegador não suporta detecção automática. Use a aba <strong>Foto</strong> para melhor resultado, ou <strong>Manual</strong>.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {mode === "file" && (
            <div className="space-y-3">
              <p className="text-sm text-foreground font-medium">Foto do código de barras</p>
              <p className="text-xs text-muted-foreground">
                Tire uma foto do código ou selecione da galeria. O sistema vai ler automaticamente.
              </p>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={scanning}
                className="w-full py-4 border-2 border-dashed border-border rounded-xl flex flex-col items-center gap-2 text-sm font-medium text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors cursor-pointer disabled:opacity-50"
              >
                {scanning ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span>Lendo código...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-6 h-6" />
                    <span>Tocar para abrir câmera / galeria</span>
                    <span className="text-xs font-normal">JPG, PNG, HEIC — qualquer imagem com código</span>
                  </>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFile}
              />

              {fileOk && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="text-sm text-emerald-700 font-medium">Código lido: {fileOk}</p>
                </div>
              )}

              {fileError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600">{fileError}</p>
                </div>
              )}

              <p className="text-xs text-muted-foreground text-center">
                Dica: foto boa = código centralizado, fundo claro, sem borrão
              </p>
            </div>
          )}

          {mode === "manual" && (
            <div className="space-y-3">
              <p className="text-sm text-foreground font-medium">Digitação manual</p>
              <p className="text-xs text-muted-foreground">
                Digite ou cole o código de barras do produto (8, 12 ou 13 dígitos).
              </p>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && handleManual()}
                placeholder="Ex: 7891000315507"
                className="w-full px-4 py-3 rounded-xl border border-border bg-muted text-foreground text-sm font-mono tracking-widest outline-none focus:ring-2 focus:ring-primary/30"
                autoFocus
              />
              <button
                onClick={handleManual}
                disabled={manualCode.trim().length < 3}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer disabled:opacity-40"
                style={{ backgroundColor: "hsl(40, 54%, 54%)", color: "hsl(220, 73%, 12%)" }}
              >
                Confirmar código
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scan-line {
          0% { top: 10%; }
          50% { top: 90%; }
          100% { top: 10%; }
        }
      `}</style>
    </div>
  );
}
