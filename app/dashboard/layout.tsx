import { requireAuth } from "@/lib/session";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  return (
    <div className="min-h-screen bg-mesh">
      <Sidebar
        role={session.role}
        userName={session.name}
        userEmail={session.email}
      />
      <main className="lg:pl-64">
        <div className="px-4 sm:px-8 lg:px-12 py-6 pt-20 lg:pt-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
