import { Link } from "wouter";
import { Shield, ArrowLeft } from "lucide-react";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
            style={{ backgroundColor: "hsl(220, 73%, 16%)" }}>
            <Shield className="w-8 h-8" style={{ color: "hsl(40, 54%, 54%)" }} />
          </div>
          <h1 className="text-6xl font-bold text-foreground">404</h1>
          <h2 className="text-xl font-semibold text-foreground mt-2">Página não encontrada</h2>
          <p className="text-muted-foreground mt-2 text-sm">A rota que você acessou não existe.</p>
          <Link href="/dashboard">
            <a className="inline-flex items-center gap-2 mt-6 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              style={{ backgroundColor: "hsl(40, 54%, 54%)", color: "hsl(220, 73%, 12%)" }}>
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Dashboard
            </a>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
