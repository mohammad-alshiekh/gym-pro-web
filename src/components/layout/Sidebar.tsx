"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCheck,
  Dumbbell,
  Layers,
  Package,
  CalendarDays,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  QrCode,
  ClipboardList,
  Clock,
  ScrollText,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { clearAuth, getUserRole, type UserRole } from "@/lib/auth";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppStore } from "@/store/useAppStore";
import toast from "react-hot-toast";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t, isRtl } = useTranslation();
  const { sidebarOpen, toggleSidebar } = useAppStore();

  // The role lives in localStorage, so it can only be read after mount —
  // reading it during render made the server and client markup disagree.
  const [role, setRole] = useState<UserRole | null>(null);
  useEffect(() => {
    setRole(getUserRole());
  }, []);

  const navItems: NavItem[] = [
    // Super Admin
    {
      label: t.nav.dashboard,
      href: "/admin/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      roles: ["super_admin"],
    },
    {
      label: t.nav.gyms,
      href: "/admin/gyms",
      icon: <Building2 className="w-5 h-5" />,
      roles: ["super_admin"],
    },
    {
      label: t.nav.trainers,
      href: "/admin/trainers",
      icon: <UserCheck className="w-5 h-5" />,
      roles: ["super_admin"],
    },
    {
      label: t.nav.trainees,
      href: "/admin/trainees",
      icon: <Users className="w-5 h-5" />,
      roles: ["super_admin"],
    },
    {
      label: t.nav.exercises,
      href: "/admin/exercises",
      icon: <Dumbbell className="w-5 h-5" />,
      roles: ["super_admin"],
    },
    {
      label: t.nav.muscleGroups,
      href: "/admin/muscle-groups",
      icon: <Layers className="w-5 h-5" />,
      roles: ["super_admin"],
    },
    // {
    //   label: t.nav.equipment,
    //   href: "/admin/equipment",
    //   icon: <Package className="w-5 h-5" />,
    //   roles: ["super_admin"],
    // },
    {
      label: t.nav.exerciseSchedules,
      href: "/admin/exercise-schedules",
      icon: <CalendarDays className="w-5 h-5" />,
      roles: ["super_admin"],
    },
    {
      label: t.nav.aiPlans,
      href: "/admin/ai-plan-packages",
      icon: <Sparkles className="w-5 h-5" />,
      roles: ["super_admin"],
    },
    // {
    //   label: t.nav.transactions,
    //   href: "/admin/transactions",
    //   icon: <CreditCard className="w-5 h-5" />,
    //   roles: ["super_admin"],
    // },

    // Gym Manager
    {
      label: t.nav.dashboard,
      href: "/manager/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      roles: ["gym_manager"],
    },
    
    {
      label: t.nav.subscriptions,
      href: "/manager/subscriptions",
      icon: <ClipboardList className="w-5 h-5" />,
      roles: ["gym_manager"],
    },
    {
      label: t.nav.plans,
      href: "/manager/plans",
      icon: <ScrollText className="w-5 h-5" />,
      roles: ["gym_manager"],
    },
    {
      label: t.nav.members,
      href: "/manager/members",
      icon: <Users className="w-5 h-5" />,
      roles: ["gym_manager"],
    },
    {
      label: t.nav.attendance,
      href: "/manager/attendance",
      icon: <Clock className="w-5 h-5" />,
      roles: ["gym_manager"],
    },
    {
      label: t.nav.analytics,
      href: "/manager/analytics",
      icon: <BarChart3 className="w-5 h-5" />,
      roles: ["gym_manager"],
    },
    {
      label: t.nav.qrCode,
      href: "/manager/qr-code",
      icon: <QrCode className="w-5 h-5" />,
      roles: ["gym_manager"],
    },
    // Last in the manager nav, and the only way into /manager/profile — the
    // profile link lives on the My Gym page's manager card.
    {
      label: t.nav.myGym,
      href: "/manager/my-gym",
      icon: <Building2 className="w-5 h-5" />,
      roles: ["gym_manager"],
    },

    // Shared — one entry for both roles instead of duplicating it per section.
    // {
    //   label: t.nav.settings,
    //   href: "/settings",
    //   icon: <Settings className="w-5 h-5" />,
    //   roles: ["super_admin", "gym_manager"],
    // },
  ];

  const filteredNav = navItems.filter((item) =>
    role ? item.roles.includes(role) : false
  );

  const handleLogout = () => {
    clearAuth();
    toast.success(t.auth.logoutSuccess);
    router.push("/");
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 lg:hidden"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 z-30 flex flex-col sidebar-transition",
          isRtl ? "right-0" : "left-0",
          sidebarOpen ? "w-64" : "w-16",
          !sidebarOpen && "max-lg:hidden"
        )}
        style={{
          background: "#0e0e0e",
          borderRight: isRtl ? "none" : "1px solid #2a2a2a",
          borderLeft: isRtl ? "1px solid #2a2a2a" : "none",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-4 py-5 border-b"
          style={{ borderColor: "#2a2a2a", minHeight: "72px" }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#cafd00" }}
          >
            <Dumbbell className="w-5 h-5" style={{ color: "#3a4a00" }} />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p
                className="text-base font-bold leading-tight truncate"
                style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}
              >
                GymBro
              </p>
              <p
                className="text-xs truncate"
                style={{ fontFamily: "JetBrains Mono, monospace", color: "#8a8888" }}
              >
                {role === "super_admin" ? t.auth.superAdmin : t.auth.gymManager}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative",
                  "hover:bg-[#20201f]",
                  isActive ? "bg-[#20201f]" : "text-[#adaaaa]"
                )}
                style={{
                  color: isActive ? "#cafd00" : undefined,
                }}
                title={!sidebarOpen ? item.label : undefined}
              >
                {/* Active indicator */}
                {isActive && (
                  <div
                    className={cn(
                      "absolute top-1/2 -translate-y-1/2 w-1 h-6 rounded-full",
                      isRtl ? "-right-2" : "-left-2"
                    )}
                    style={{ background: "#cafd00" }}
                  />
                )}
                <span className="flex-shrink-0">{item.icon}</span>
                {sidebarOpen && (
                  <span
                    className="text-sm font-medium truncate"
                    style={{ fontFamily: "Manrope, sans-serif" }}
                  >
                    {item.label}
                  </span>
                )}
                {/* Tooltip for collapsed */}
                {!sidebarOpen && (
                  <div
                    className={cn(
                      "absolute hidden group-hover:flex items-center px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap z-50 pointer-events-none",
                      isRtl ? "right-14" : "left-14"
                    )}
                    style={{ background: "#2a2a28", color: "#ffffff", border: "1px solid #2a2a2a" }}
                  >
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t" style={{ borderColor: "#2a2a2a" }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all hover:bg-[#5c1620]/20 text-[#ff6e81]"
            title={!sidebarOpen ? t.auth.logout : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && (
              <span className="text-sm font-medium" style={{ fontFamily: "Manrope, sans-serif" }}>
                {t.auth.logout}
              </span>
            )}
          </button>
        </div>

        {/* Toggle button */}
        <button
          onClick={toggleSidebar}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center z-40",
            isRtl ? "-left-3" : "-right-3"
          )}
          style={{ background: "#cafd00", color: "#3a4a00" }}
        >
          {isRtl
            ? sidebarOpen ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />
            : sidebarOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
      </aside>
    </>
  );
}
