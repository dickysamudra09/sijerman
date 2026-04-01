"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { User, ChevronDown, Home, BookOpen, Globe, LogOut, Settings } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface UserMenuDropdownProps {
  user: SupabaseUser | null;
  onLogout: () => void;
  onNavigate: (path: string) => void;
}

export default function UserMenuDropdown({ user, onLogout, onNavigate }: UserMenuDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && 
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  if (!user) return null;

  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center h-12 w-12 rounded-lg transition-colors hover:bg-gray-700"
        style={{ color: "#FFFFFC" }}
        title="Menu Profil"
      >
        <div className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: "#14B8A6", color: "#FFFFFF" }}>
          {initials}
        </div>
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg py-1"
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E2E8F0",
            zIndex: 99999,
            top: "100%",
            marginTop: "8px"
          }}
        >
          {/* User Info Header */}
          <div
            className="px-4 py-3 border-b"
            style={{ color: "#1A1A1A", borderColor: "#E2E8F0" }}
          >
            <p className="text-sm font-semibold">{displayName}</p>
            <p className="text-xs" style={{ color: "#64748B" }}>{user.email}</p>
          </div>

          {/* Navigation Items */}
          <button
            onClick={() => {
              onNavigate("/");
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center gap-3"
            style={{ color: "#1A1A1A" }}
          >
            <Home className="h-4 w-4" style={{ color: "#0F766E" }} />
            <span>Beranda</span>
          </button>

          <button
            onClick={() => {
              onNavigate("/home/teacher?tab=my-courses");
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center gap-3"
            style={{ color: "#1A1A1A" }}
          >
            <BookOpen className="h-4 w-4" style={{ color: "#14B8A6" }} />
            <span>Kursus Saya</span>
          </button>

          <button
            onClick={() => {
              onNavigate("/open-courses");
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center gap-3"
            style={{ color: "#1A1A1A" }}
          >
            <Globe className="h-4 w-4" style={{ color: "#F59E0B" }} />
            <span>Jelajahi Kursus</span>
          </button>

          {/* Divider */}
          <div style={{ borderColor: "#E2E8F0" }} className="border-t my-1"></div>

          {/* Logout */}
          <button
            onClick={() => {
              onLogout();
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 transition-colors flex items-center gap-3"
            style={{ color: "#DC2626" }}
          >
            <LogOut className="h-4 w-4" />
            <span>Keluar</span>
          </button>
        </div>
      )}
    </div>
  );
}
