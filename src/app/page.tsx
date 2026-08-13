"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "@/lib/auth";
import LoginPage from "@/components/auth/LoginPage";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    if (auth) {
      if (auth.role === "super_admin") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/manager/dashboard");
      }
    }
  }, [router]);

  return <LoginPage />;
}
