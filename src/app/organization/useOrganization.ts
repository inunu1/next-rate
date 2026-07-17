"use client";

import { useState, useCallback } from "react";
import { parseApiResponse } from "@/lib/fetchJson";

export type OrganizationOption = {
  value: string;
  label: string;
};

export type OrganizationRecord = {
  id: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
};

export function useOrganization() {
  const [mounted, setMounted] = useState(false);
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<OrganizationRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"search" | "register">("search");
  const [searchOpt, setSearchOpt] = useState<OrganizationOption | null>(null);
  const [registerName, setRegisterName] = useState("");
  const [lastAction, setLastAction] = useState<string | null>(null);

  const fetchOrganizations = useCallback(async () => {
    try {
      const res = await fetch("/api/private/organization");
      const data = await parseApiResponse<OrganizationRecord[]>(res);
      setOrganizations(data);
      setFilteredOrganizations(data);
    } catch {
      setLastAction("fetch-error");
    }
  }, []);

  const init = useCallback(async () => {
    setMounted(true);
    await fetchOrganizations();
  }, [fetchOrganizations]);

  const userOptions: OrganizationOption[] = organizations.map((o) => ({
    value: o.id,
    label: o.name ?? "(名前なし)",
  }));

  const handleRegister = useCallback(async () => {
    if (!registerName.trim()) {
      setLastAction("register-error");
      return;
    }

    try {
      const res = await fetch("/api/private/organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: registerName.trim() }),
      });
      await parseApiResponse(res);

      setRegisterName("");
      setLastAction("register-success");
      await fetchOrganizations();
    } catch {
      setLastAction("register-error");
    }
  }, [registerName, fetchOrganizations]);

  const handleSearch = useCallback(() => {
    if (!searchOpt) {
      setFilteredOrganizations(organizations);
      setLastAction("search");
      return;
    }
    setFilteredOrganizations(organizations.filter((o) => o.id === searchOpt.value));
    setLastAction("search");
  }, [searchOpt, organizations]);

  const clearSearch = useCallback(() => {
    setSearchOpt(null);
    setFilteredOrganizations(organizations);
    setLastAction("search");
  }, [organizations]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("この団体を削除しますか？")) return;

      try {
        const res = await fetch("/api/private/organization", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        await parseApiResponse(res);
        setLastAction("delete-success");
        await fetchOrganizations();
      } catch {
        setLastAction("delete-error");
      }
    },
    [fetchOrganizations]
  );

  return {
    mounted,
    init,
    activeTab,
    setActiveTab,
    searchOpt,
    setSearchOpt,
    registerName,
    setRegisterName,
    userOptions,
    organizations,
    filteredOrganizations,
    handleSearch,
    clearSearch,
    handleRegister,
    handleDelete,
    lastAction,
  };
}
