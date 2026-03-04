import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | prd-to-prod Studio",
};

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
