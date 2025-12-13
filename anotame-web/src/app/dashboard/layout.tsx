import DashboardLayout from "@/components/layout/DashboardLayout";

// This layout wraps all pages under /dashboard
export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
