"use client";

import { useEffect } from "react";
import { verifyAdmin } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";

export default function AdminProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const setIsAdmin = useAdminStore((state) => state.setIsAdmin);
  const setIsLoading = useAdminStore((state) => state.setIsLoading);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { is_admin } = await verifyAdmin();
        setIsAdmin(is_admin);
      } catch {
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [setIsAdmin, setIsLoading]);

  return <>{children}</>;
}
