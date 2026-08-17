"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "@/lib/auth";
import LoginPage from "@/components/auth/LoginPage";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { useTranslation } from "@/hooks/useTranslation";

export default function HomePage() {
  const router = useRouter();
  const { t } = useTranslation();

  /*
   * `getAuth()` reads localStorage, so it can only run after mount. Rendering
   * the login form in the meantime made an already-signed-in user watch it
   * appear and then get yanked away, so hold the overlay until we know — and
   * keep holding it through the redirect, which `replace` only queues.
   */
  const [resolving, setResolving] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    if (auth) {
      router.replace(
        auth.role === "super_admin" ? "/admin/dashboard" : "/manager/dashboard"
      );
      return;
    }
    setResolving(false);
  }, [router]);

  if (resolving) {
    return <LoadingOverlay message={t.common.loading} hint={t.auth.restoringSession} />;
  }

  return <LoginPage />;
}
