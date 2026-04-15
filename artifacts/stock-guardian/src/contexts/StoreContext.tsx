import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from "react";
import {
  Product,
  Lot,
  ReposicaoRecord,
  Notification,
  getDaysToExpire,
} from "@/services/mockData";
import { getProductByBarcode, getAllProducts, initProducts } from "@/services/productsDB";
import { sincronizarComServidor } from "@/services/integracao";
import {
  initDB,
  loadLots,
  saveLot,
  loadReposicoes,
  saveReposicao,
  loadNotifications,
  saveNotification,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/services/neonDB";

const DATA_VERSION = "real_v2_produtos_reais";

function clearMockDataIfNeeded() {
  if (localStorage.getItem("sg_data_version") !== DATA_VERSION) {
    localStorage.removeItem("sg_lots");
    localStorage.removeItem("sg_reposicoes");
    localStorage.removeItem("sg_notifications");
    localStorage.removeItem("sg_last_sync");
    localStorage.removeItem("sg_last_sync_source");
    localStorage.removeItem("sg_users_state");
    localStorage.removeItem("sg_auth_store");
    localStorage.setItem("sg_data_version", DATA_VERSION);
  }
}

interface EficienciaUsuario {
  usuario: string;
  usuarioNome: string;
  total: number;
  erros: number;
  eficiencia: number;
}

interface StoreContextType {
  products: Product[];
  lots: Lot[];
  reposicoes: ReposicaoRecord[];
  notifications: Notification[];
  isSyncing: boolean;
  lastSync: string | null;
  lastSyncSource: "servidor" | "mock" | null;
  productsReady: boolean;
  addLot: (lot: Lot) => void;
  addReposicao: (record: ReposicaoRecord) => void;
  addNotification: (notif: Omit<Notification, "id" | "lida" | "data">) => void;
  markAllRead: (usuario: string, isAdmin: boolean) => void;
  markOneRead: (id: string) => void;
  getUnreadCount: (usuario: string, isAdmin: boolean) => number;
  getNotificationsForUser: (usuario: string, isAdmin: boolean) => Notification[];
  syncAPI: () => Promise<void>;
  getMinValidadeForProduct: (codigo: string) => string | null;
  eficienciaUsuarios: EficienciaUsuario[];
  produtosEmRisco: { produto: Product; lot: Lot; diasRestantes: number }[];
  valorTotalEmRisco: number;
}

const StoreContext = createContext<StoreContextType | null>(null);

const STORAGE_KEYS = {
  lots: "sg_lots",
  reposicoes: "sg_reposicoes",
  notifications: "sg_notifications",
  lastSync: "sg_last_sync",
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {}
  return fallback;
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [lots, setLots] = useState<Lot[]>(() => {
    clearMockDataIfNeeded();
    return loadFromStorage<Lot[]>(STORAGE_KEYS.lots, []);
  });
  const [reposicoes, setReposicoes] = useState<ReposicaoRecord[]>(() =>
    loadFromStorage<ReposicaoRecord[]>(STORAGE_KEYS.reposicoes, [])
  );
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    loadFromStorage<Notification[]>(STORAGE_KEYS.notifications, [])
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [productsReady, setProductsReady] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEYS.lastSync)
  );
  const [lastSyncSource, setLastSyncSource] = useState<"servidor" | "mock" | null>(() => {
    const v = localStorage.getItem("sg_last_sync_source");
    return v === "servidor" || v === "mock" ? v : null;
  });

  const isSyncingRef = useRef(false);
  const dbInitialized = useRef(false);

  useEffect(() => { saveToStorage(STORAGE_KEYS.lots, lots); }, [lots]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.reposicoes, reposicoes); }, [reposicoes]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.notifications, notifications); }, [notifications]);
  useEffect(() => {
    if (lastSync) localStorage.setItem(STORAGE_KEYS.lastSync, lastSync);
  }, [lastSync]);

  // Initialize products catalog
  useEffect(() => {
    initProducts().then(() => setProductsReady(true));
  }, []);

  // Load from Neon DB
  const loadFromNeon = useCallback(async () => {
    if (dbInitialized.current) {
      try {
        const [dbLots, dbRepos, dbNotifs] = await Promise.all([
          loadLots(),
          loadReposicoes(),
          loadNotifications(),
        ]);
        if (dbLots.length > 0) {
          setLots(dbLots);
          saveToStorage(STORAGE_KEYS.lots, dbLots);
        }
        if (dbRepos.length > 0) {
          setReposicoes(dbRepos);
          saveToStorage(STORAGE_KEYS.reposicoes, dbRepos);
        }
        if (dbNotifs.length > 0) {
          setNotifications(dbNotifs);
          saveToStorage(STORAGE_KEYS.notifications, dbNotifs);
        }
      } catch (e) {
        console.warn("[StoreContext] Erro ao recarregar Neon:", e);
      }
      return;
    }

    const ok = await initDB();
    if (!ok) return;
    dbInitialized.current = true;

    try {
      const [dbLots, dbRepos, dbNotifs] = await Promise.all([
        loadLots(),
        loadReposicoes(),
        loadNotifications(),
      ]);
      if (dbLots.length > 0) {
        setLots(dbLots);
        saveToStorage(STORAGE_KEYS.lots, dbLots);
      }
      if (dbRepos.length > 0) {
        setReposicoes(dbRepos);
        saveToStorage(STORAGE_KEYS.reposicoes, dbRepos);
      }
      if (dbNotifs.length > 0) {
        setNotifications(dbNotifs);
        saveToStorage(STORAGE_KEYS.notifications, dbNotifs);
      }
    } catch (e) {
      console.warn("[StoreContext] Erro ao carregar do Neon:", e);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadFromNeon();
  }, [loadFromNeon]);

  // Polling: refresh DB data every 30 seconds
  useEffect(() => {
    const id = setInterval(() => {
      loadFromNeon();
    }, 30_000);
    return () => clearInterval(id);
  }, [loadFromNeon]);

  const addLot = useCallback((lot: Lot) => {
    setLots((prev) => [lot, ...prev]);
    saveLot(lot);
    const notif: Notification = {
      id: generateId("notif"),
      tipo: "lote",
      mensagem: `Novo lote recebido: ${lot.produtoNome} — validade ${new Date(lot.validade + "T00:00:00").toLocaleDateString("pt-BR")}.`,
      destinatario: "todos",
      lida: false,
      data: new Date().toISOString(),
    };
    setNotifications((prev) => [notif, ...prev]);
    saveNotification(notif);
  }, []);

  const addReposicao = useCallback((record: ReposicaoRecord) => {
    setReposicoes((prev) => [record, ...prev]);
    saveReposicao(record);

    if (record.erro_fifo) {
      const notif: Notification = {
        id: generateId("notif"),
        tipo: "fifo",
        mensagem: `Usuário ${record.usuarioNome} não respeitou o rodízio de validade no produto ${record.produtoNome}.`,
        destinatario: "admin",
        lida: false,
        data: new Date().toISOString(),
      };
      setNotifications((prev) => [notif, ...prev]);
      saveNotification(notif);
    }
  }, []);

  const addNotification = useCallback(
    (notif: Omit<Notification, "id" | "lida" | "data">) => {
      const nova: Notification = {
        ...notif,
        id: generateId("notif"),
        lida: false,
        data: new Date().toISOString(),
      };
      setNotifications((prev) => [nova, ...prev]);
      saveNotification(nova);
    },
    []
  );

  const markAllRead = useCallback((usuario: string, isAdmin: boolean) => {
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.lida) return n;
        if (n.destinatario === "todos") return { ...n, lida: true };
        if (isAdmin && n.destinatario === "admin") return { ...n, lida: true };
        return n;
      })
    );
    markAllNotificationsRead();
  }, []);

  const markOneRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
    );
    markNotificationRead(id);
  }, []);

  const getNotificationsForUser = useCallback(
    (usuario: string, isAdmin: boolean): Notification[] => {
      return notifications.filter(
        (n) => n.destinatario === "todos" || (isAdmin && n.destinatario === "admin")
      );
    },
    [notifications]
  );

  const getUnreadCount = useCallback(
    (usuario: string, isAdmin: boolean): number => {
      return getNotificationsForUser(usuario, isAdmin).filter((n) => !n.lida).length;
    },
    [getNotificationsForUser]
  );

  const getMinValidadeForProduct = useCallback(
    (codigo: string): string | null => {
      const prodLots = lots.filter((l) => l.produtoCodigo === codigo);
      if (prodLots.length === 0) return null;
      return prodLots.reduce((min, l) =>
        new Date(l.validade) < new Date(min.validade) ? l : min
      ).validade;
    },
    [lots]
  );

  const syncAPI = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setIsSyncing(true);
    try {
      const result = await sincronizarComServidor();
      const now = new Date().toISOString();

      result.produtos.forEach((p) => {
        const lot: Lot = {
          id: generateId("lot"),
          produtoCodigo: p.codigoBarras,
          produtoNome: p.nome,
          quantidade: p.quantidade,
          validade: p.validade,
          custo: p.custo,
          precoVenda: p.preco_venda,
          dataRecebimento: now.split("T")[0],
          origem: "api",
        };
        addLot(lot);
      });

      setLastSync(now);
      setLastSyncSource(result.fonte);
      localStorage.setItem("sg_last_sync_source", result.fonte);

      const fonteLabel = result.fonte === "servidor" ? "servidor real" : "dados simulados";
      const erroInfo = result.erro ? ` (${result.erro})` : "";
      addNotification({
        tipo: "sistema",
        mensagem: `Sincronização concluída: ${result.produtos.length} lote(s) via ${fonteLabel}.${erroInfo}`,
        destinatario: "todos",
      });
    } catch {
      addNotification({
        tipo: "sistema",
        mensagem: "Erro ao sincronizar com a API externa. Tente novamente.",
        destinatario: "admin",
      });
    } finally {
      setIsSyncing(false);
      isSyncingRef.current = false;
    }
  }, [addLot, addNotification]);

  const eficienciaUsuarios = useMemo<EficienciaUsuario[]>(() => {
    const map: Record<string, EficienciaUsuario> = {};
    reposicoes.forEach((r) => {
      if (!map[r.usuario]) {
        map[r.usuario] = {
          usuario: r.usuario,
          usuarioNome: r.usuarioNome,
          total: 0,
          erros: 0,
          eficiencia: 100,
        };
      }
      map[r.usuario].total++;
      if (r.erro_fifo) map[r.usuario].erros++;
    });
    return Object.values(map).map((u) => ({
      ...u,
      eficiencia: u.total > 0 ? ((u.total - u.erros) / u.total) * 100 : 100,
    })).sort((a, b) => b.eficiencia - a.eficiencia);
  }, [reposicoes]);

  const produtosEmRisco = useMemo(() => {
    const result: { produto: Product; lot: Lot; diasRestantes: number }[] = [];
    const seen = new Set<string>();

    lots.forEach((lot) => {
      const dias = getDaysToExpire(lot.validade);
      if (dias <= 15 && lot.quantidade > 0 && !seen.has(lot.id)) {
        const produto = getProductByBarcode(lot.produtoCodigo);
        if (produto) {
          result.push({ produto, lot, diasRestantes: dias });
          seen.add(lot.id);
        }
      }
    });

    return result.sort((a, b) => a.diasRestantes - b.diasRestantes);
  }, [lots]);

  const valorTotalEmRisco = useMemo(
    () =>
      produtosEmRisco
        .filter((r) => r.diasRestantes <= 7)
        .reduce((acc, r) => acc + r.lot.quantidade * r.lot.custo, 0),
    [produtosEmRisco]
  );

  const products = useMemo(() => getAllProducts(), [productsReady]);

  return (
    <StoreContext.Provider
      value={{
        products,
        lots,
        reposicoes,
        notifications,
        isSyncing,
        lastSync,
        lastSyncSource,
        productsReady,
        addLot,
        addReposicao,
        addNotification,
        markAllRead,
        markOneRead,
        getUnreadCount,
        getNotificationsForUser,
        syncAPI,
        getMinValidadeForProduct,
        eficienciaUsuarios,
        produtosEmRisco,
        valorTotalEmRisco,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore deve ser usado dentro de StoreProvider");
  return ctx;
}
