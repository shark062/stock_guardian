import { ReactNode, useState, useCallback } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface LayoutProps {
  children: ReactNode;
  title: string;
}

export function Layout({ children, title }: LayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setMobileSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setMobileSidebarOpen((v) => !v), []);

  return (
    <div className="min-h-screen bg-background flex">
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out ${
        mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}>
        <Sidebar onClose={closeSidebar} />
      </div>

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Header title={title} onMenuClick={toggleSidebar} />
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
