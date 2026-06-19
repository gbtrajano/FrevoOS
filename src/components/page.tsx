"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { LensMark } from "@/components/lens-mark";

export default function Home() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(session ? "/painel" : "/login");
  }, [loading, session, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand-100">
      <LensMark className="h-10 w-10 animate-pulse text-garnet-500" />
    </div>
  );
}
