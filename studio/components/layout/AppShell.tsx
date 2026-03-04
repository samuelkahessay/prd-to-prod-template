import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar />
          <main 
            className="page-fade-in flex-1 overflow-y-auto p-4 md:p-6"
            data-testid="main-content"
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
