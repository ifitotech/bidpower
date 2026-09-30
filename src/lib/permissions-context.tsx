"use client";

import { createContext, useContext } from "react";
import { NO_PERMISSIONS, type Permissions } from "@/lib/permissions";

type Value = {
  role: string;
  permissions: Permissions;
  isOwner: boolean;
  isManagerOrAbove: boolean;
};

const PermissionsContext = createContext<Value>({ role: "", permissions: NO_PERMISSIONS, isOwner: false, isManagerOrAbove: false });

/** UI convenience only. The database (RLS) and server actions enforce every rule. */
export function PermissionsProvider({ role, permissions, children }: { role: string; permissions: Permissions; children: React.ReactNode }) {
  return (
    <PermissionsContext.Provider value={{ role, permissions, isOwner: role === "owner", isManagerOrAbove: role === "owner" || role === "manager" }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  return useContext(PermissionsContext);
}
