import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { StoreProvider } from "@/contexts/StoreContext";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import Reports from "@/pages/Reports";
import UsersPage from "@/pages/Users";
import AuditLog from "@/pages/AuditLog";
import Reposicao from "@/pages/Reposicao";
import Promocoes from "@/pages/Promocoes";
import Eficiencia from "@/pages/Eficiencia";
import Consulta from "@/pages/Consulta";
import ImportarDados from "@/pages/ImportarDados";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function PrivateRoute({
  component: Component,
  adminOnly = false,
  operadorPlus = false,
}: {
  component: React.ComponentType;
  adminOnly?: boolean;
  operadorPlus?: boolean;
}) {
  const { user, isLoading, isAdmin, isOperador } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-fade-in">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Redirect to="/login" />;
  if (adminOnly && !isAdmin) return <Redirect to="/dashboard" />;
  if (operadorPlus && !isAdmin && !isOperador) return <Redirect to="/dashboard" />;

  return <Component />;
}

function Router() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/dashboard">
        {() => <PrivateRoute component={Dashboard} />}
      </Route>
      <Route path="/produtos">
        {() => <PrivateRoute component={Products} />}
      </Route>
      <Route path="/reposicao">
        {() => <PrivateRoute component={Reposicao} operadorPlus />}
      </Route>
      <Route path="/promocoes">
        {() => <PrivateRoute component={Promocoes} />}
      </Route>
      <Route path="/eficiencia">
        {() => <PrivateRoute component={Eficiencia} adminOnly />}
      </Route>
      <Route path="/relatorios">
        {() => <PrivateRoute component={Reports} />}
      </Route>
      <Route path="/usuarios">
        {() => <PrivateRoute component={UsersPage} adminOnly />}
      </Route>
      <Route path="/auditoria">
        {() => <PrivateRoute component={AuditLog} adminOnly />}
      </Route>
      <Route path="/consulta">
        {() => <PrivateRoute component={Consulta} />}
      </Route>
      <Route path="/importar">
        {() => <PrivateRoute component={ImportarDados} adminOnly />}
      </Route>
      <Route path="/">
        {() => user ? <Redirect to="/dashboard" /> : <Redirect to="/login" />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StoreProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster
            position="top-right"
            richColors
            closeButton
            duration={4000}
          />
        </StoreProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
