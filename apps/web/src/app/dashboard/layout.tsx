"use client";
import React, { useState } from "react";
import { Sidebar } from "@ghostclip/ui";
import { useRouter } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [activeItem, setActiveItem] = useState("feed");
  const router = useRouter();

  const handleNavigation = (id: string) => {
    setActiveItem(id);
    const routes: Record<string, string> = {
      feed: "/dashboard",
      pinned: "/dashboard?filter=pinned",
      today: "/dashboard?filter=today",
      week: "/dashboard?filter=week",
      archive: "/dashboard?filter=archive",
      analytics: "/dashboard/analytics",
      devices: "/dashboard/devices",
      settings: "/dashboard/settings",
      account: "/dashboard/account",
    };
    router.push(routes[id] || "/dashboard");
  };

  return (
    <div className="flex h-screen bg-surface-DEFAULT">
      <Sidebar activeItem={activeItem} onItemClick={handleNavigation} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
