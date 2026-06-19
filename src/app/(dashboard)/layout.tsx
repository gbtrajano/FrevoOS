"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ToastProvider } from "@/lib/toast-context";
import { Navbar } from "@/components/navbar";
import { LensMark } from "@/components/lens-mark";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [loading, session, router]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand-100">
        <LensMark className="h-10 w-10 animate-pulse text-garnet-500" />
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-sand-100">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
