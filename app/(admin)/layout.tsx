import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  return (
    <div data-admin-layout="true" className="min-h-screen bg-[#0a0a0a]">
      <AdminSidebar />
      <main className="min-h-screen bg-[#0a0a0a] px-4 pb-8 pt-20 md:ml-[240px] md:p-8">
        {children}
      </main>
    </div>
  );
}
