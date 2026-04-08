import { useState, useRef, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { findProductByBarcode } from "@/services/integracao";
import { ReposicaoRecord } from "@/services/mockData";
import {
  Camera,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  RefreshCw,
  Package,
  Calendar,
  Hash,
  ImageIcon,
  Clock,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

interface FormState {
  codigoBarras: string;
  produtoNome: string;
  quantidade: string;
  validade: string;
  imagemUrl: string;
  imagemPreview: string;
}

const INITIAL: FormState = {
  codigoBarras: "",
  produtoNome: "",
  quantidade: "",
  validade: "",
  imagemUrl: "",
  imagemPreview: "",
};

export default function Reposicao() {
  const { user } = useAuth();
  const { addReposicao, getMinValidadeForProduct, reposicoes } = useStore();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [showScanner, setShowScanner] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lastRecord, setLastRecord] = useState<ReposicaoRecord | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const missingBarcode = !form.codigoBarras;
  const missingPhoto = !form.imagemUrl;
  const missingQtd = !form.quantidade || isNaN(Number(form.quantidade)) || Number(form.quantidade) <= 0;
  const missingValidade = !form.validade;
  const canSubmit = !missingBarcode && !missingPhoto && !missingQtd && !missingValidade;

  const handleBarcode = useCallback((code: string) => {
    setShowScanner(false);
    const produto = findProductByBarcode(code);
    setForm((f) => ({
      ...f,
      codigoBarras: code,
      produtoNome: produto?.nome ?? "",
    }));
    if (produto) {
      toast.success(`Produto identificado: ${produto.nome}`);
    } else {
      toast.warning("Código não encontrado no catálogo. Informe o nome manualmente.");
    }
  }, []);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setForm((f) => ({ ...f, imagemUrl: dataUrl, imagemPreview: dataUrl }));
      toast.success("Foto da validade capturada!");
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit() {
    if (!canSubmit || !user) return;

    const minValidade = getMinValidadeForProduct(form.codigoBarras);
    const erroFifo =
      minValidade !== null &&
      new Date(form.validade) > new Date(minValidade);

    const record: ReposicaoRecord = {
      id: generateId("rep"),
      produtoCodigo: form.codigoBarras,
      produtoNome: form.produtoNome || form.codigoBarras,
      quantidade: Number(form.quantidade),
      validade: form.validade,
      imagemUrl: form.imagemUrl,
      usuario: user.email,
      usuarioNome: user.nome,
      data: new Date().toISOString(),
      erro_fifo: erroFifo,
      inconsistencia_imagem: false,
    };

    addReposicao(record);
    setLastRecord(record);
    setSubmitted(true);

    if (erroFifo) {
      toast.error("Erro FIFO detectado! O administrador foi notificado.", {
        duration: 5000,
      });
    } else {
      toast.success("Reposição registrada com sucesso!");
    }
  }

  function handleNovo() {
    setForm(INITIAL);
    setSubmitted(false);
    setLastRecord(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  const minhasReposicoes = reposicoes
    .filter((r) => r.usuario === user?.email)
    .slice(0, 5);

  if (submitted && lastRecord) {
    return (
      <Layout title="Reposição">
        <div className="max-w-lg mx-auto">
          <div className="bg-card rounded-2xl border border-card-border shadow-sm p-8 text-center">
            {lastRecord.erro_fifo ? (
              <>
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-lg font-bold text-foreground mb-1">Reposição registrada</h2>
                <p className="text-sm text-red-600 font-medium mb-2">Erro FIFO detectado!</p>
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 text-left">
                  <p className="text-xs text-red-700">
                    A validade informada é mais recente do que um lote já existente no estoque.
                    O rodízio de validade não foi respeitado. O administrador foi notificado.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h2 className="text-lg font-bold text-foreground mb-1">Reposição concluída!</h2>
                <p className="text-sm text-muted-foreground mb-6">Rodízio FIFO respeitado corretamente.</p>
              </>
            )}

            <div className="bg-muted rounded-xl p-4 text-left space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Produto</span>
                <span className="font-medium text-foreground">{lastRecord.produtoNome}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Quantidade</span>
                <span className="font-medium text-foreground">{lastRecord.quantidade} un.</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Validade</span>
                <span className="font-medium text-foreground">
                  {new Date(lastRecord.validade + "T00:00:00").toLocaleDateString("pt-BR")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">FIFO</span>
                <span className={`font-semibold ${lastRecord.erro_fifo ? "text-red-600" : "text-emerald-600"}`}>
                  {lastRecord.erro_fifo ? "Erro" : "OK"}
                </span>
              </div>
            </div>

            <button
              onClick={handleNovo}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer"
              style={{ backgroundColor: "hsl(40, 54%, 54%)", color: "hsl(220, 73%, 12%)" }}
            >
              Nova Reposição
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Reposição de Produto">
      {showScanner && (
        <BarcodeScanner
          onDetected={handleBarcode}
          onClose={() => setShowScanner(false)}
        />
      )}

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-card rounded-2xl border border-card-border shadow-sm p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground">Registrar Reposição</h2>

          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5" />
                Código de Barras <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.codigoBarras}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, codigoBarras: e.target.value }))
                  }
                  placeholder="Digite ou escaneie o código"
                  className="flex-1 px-3 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  onClick={() => setShowScanner(true)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 shrink-0"
                  style={{ backgroundColor: "hsl(220, 73%, 16%)", color: "white" }}
                >
                  <Camera className="w-4 h-4" />
                  Escanear
                </button>
              </div>
            </div>

            {form.produtoNome && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <Package className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-emerald-700">{form.produtoNome}</p>
                  <p className="text-xs text-emerald-600">{form.codigoBarras}</p>
                </div>
              </div>
            )}

            {!form.produtoNome && form.codigoBarras && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Nome do produto
                </label>
                <input
                  type="text"
                  value={form.produtoNome}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, produtoNome: e.target.value }))
                  }
                  placeholder="Informe o nome do produto"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5" />
                  Quantidade <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.quantidade}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, quantidade: e.target.value }))
                  }
                  placeholder="0"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Validade <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.validade}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, validade: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                Foto da Validade <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full py-3 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  {form.imagemUrl ? "Trocar foto" : "Tirar foto da validade"}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhoto}
                />
                {form.imagemPreview && (
                  <div className="relative">
                    <img
                      src={form.imagemPreview}
                      alt="Foto da validade"
                      className="w-full h-32 object-cover rounded-xl border border-border"
                    />
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Foto OK
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {!canSubmit && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-xs font-medium text-amber-800 mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Campos obrigatórios pendentes:
              </p>
              <ul className="text-xs text-amber-700 space-y-0.5 ml-5 list-disc">
                {missingBarcode && <li>Código de barras (escaneie ou digite)</li>}
                {missingQtd && <li>Quantidade deve ser maior que zero</li>}
                {missingValidade && <li>Data de validade do produto</li>}
                {missingPhoto && <li>Foto da etiqueta de validade</li>}
              </ul>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
              canSubmit
                ? "cursor-pointer shadow-sm hover:shadow-md"
                : "opacity-40 cursor-not-allowed"
            }`}
            style={
              canSubmit
                ? { backgroundColor: "hsl(40, 54%, 54%)", color: "hsl(220, 73%, 12%)" }
                : { backgroundColor: "hsl(40, 54%, 54%)", color: "hsl(220, 73%, 12%)" }
            }
          >
            Registrar Reposição
          </button>
        </div>

        {minhasReposicoes.length > 0 && (
          <div className="bg-card rounded-2xl border border-card-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Minhas Últimas Reposições</h3>
            </div>
            <div className="divide-y divide-border">
              {minhasReposicoes.map((r) => (
                <div key={r.id} className="px-5 py-3 flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${r.erro_fifo ? "bg-red-500" : "bg-emerald-500"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.produtoNome}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.quantidade} un. — Val. {new Date(r.validade + "T00:00:00").toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {r.erro_fifo ? (
                      <span className="text-xs bg-red-100 text-red-600 font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        FIFO
                      </span>
                    ) : (
                      <span className="text-xs bg-emerald-100 text-emerald-600 font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        OK
                      </span>
                    )}
                    {r.imagemUrl && (
                      <span className="text-xs bg-blue-100 text-blue-600 font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        Foto
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
