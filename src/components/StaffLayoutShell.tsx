"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Map as MapIcon,
    ListTodo,
    AlertOctagon,
    Bell,
    Search,
    UserCircle,
    Menu,
    X,
    Users,
    BarChart3
} from "lucide-react";
import { Input } from "@/components/ui/input";

export function StaffLayoutShell({
    children,
    sidebarAuth,
}: {
    children: React.ReactNode;
    sidebarAuth: React.ReactNode;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const closeSidebar = () => setIsOpen(false);

    return (
        <div className="flex h-screen bg-slate-50 relative">
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950 shrink-0">
                    <span className="text-white font-bold text-lg flex items-center gap-2 tracking-tight">
                        <span className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-sm">
                            C
                        </span>
                        CivicShakti Auth
                    </span>
                    <button
                        className="md:hidden text-slate-400 hover:text-white transition-colors"
                        onClick={closeSidebar}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                    <Link
                        href="/staff/dashboard"
                        onClick={closeSidebar}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-sm font-medium transition-colors ${pathname === "/staff/dashboard"
                            ? "bg-blue-600/10 text-blue-400"
                            : "text-slate-300 hover:bg-slate-800"
                            }`}
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        Overview
                    </Link>
                    <Link
                        href="/staff/complaints"
                        onClick={closeSidebar}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-sm transition-colors ${pathname.startsWith("/staff/complaints")
                            ? "bg-blue-600/10 text-blue-400 font-medium"
                            : "text-slate-300 hover:bg-slate-800"
                            }`}
                    >
                        <ListTodo className="w-5 h-5" />
                        All Complaints
                    </Link>
                    <Link
                        href="/staff/heatmap"
                        onClick={closeSidebar}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-sm transition-colors ${pathname === "/staff/heatmap"
                            ? "bg-blue-600/10 text-blue-400 font-medium"
                            : "text-slate-300 hover:bg-slate-800"
                            }`}
                    >
                        <MapIcon className="w-5 h-5" />
                        Heatmap
                    </Link>
                    <Link
                        href="/staff/users"
                        onClick={closeSidebar}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-sm transition-colors ${pathname.startsWith("/staff/users")
                            ? "bg-blue-600/10 text-blue-400 font-medium"
                            : "text-slate-300 hover:bg-slate-800"
                            }`}
                    >
                        <UserCircle className="w-5 h-5" />
                        Citizens
                    </Link>
                    <Link
                        href="/staff/accounts"
                        onClick={closeSidebar}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-sm transition-colors ${pathname.startsWith("/staff/accounts")
                            ? "bg-blue-600/10 text-blue-400 font-medium"
                            : "text-slate-300 hover:bg-slate-800"
                            }`}
                    >
                        <Users className="w-5 h-5" />
                        User Accounts
                    </Link>
                    <Link
                        href="/staff/stats"
                        onClick={closeSidebar}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-sm transition-colors ${pathname === "/staff/stats"
                            ? "bg-blue-600/10 text-blue-400 font-medium"
                            : "text-slate-300 hover:bg-slate-800"
                            }`}
                    >
                        <BarChart3 className="w-5 h-5" />
                        App Stats
                    </Link>
                    <Link
                        href="/staff/train-ai"
                        onClick={closeSidebar}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-sm transition-colors ${pathname === "/staff/train-ai"
                            ? "bg-blue-600/10 text-blue-400 font-medium"
                            : "text-slate-300 hover:bg-slate-800"
                            }`}
                    >
                        <AlertOctagon className="w-5 h-5 hidden" />
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-brain-circuit"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M9 13a4.5 4.5 0 0 0 3-4"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M6 18a4 4 0 0 1-1.968-3.568"/><path d="M12 18a4 4 0 0 1-4.466-3.925"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4"/><path d="M17.997 5.125A3 3 0 0 1 17.599 6.5"/><path d="M20.523 10.896a4 4 0 0 0-.585-.396"/><path d="M18 18a4 4 0 0 0 1.968-3.568"/><path d="M12 18a4 4 0 0 0 4.466-3.925"/></svg>
                        Train AI Model
                    </Link>
                    <Link
                        href="/staff/errors"
                        onClick={closeSidebar}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-sm transition-colors ${pathname === "/staff/errors"
                            ? "bg-rose-950/80 text-rose-400 font-medium"
                            : "text-rose-400 hover:bg-rose-950/50 hover:text-rose-300"
                            }`}
                    >
                        <AlertOctagon className="w-5 h-5" />
                        System Errors
                    </Link>
                </nav>

                {/* Dynamic User Profile and Logout */}
                {sidebarAuth}
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen bg-slate-50">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 z-10">
                    <div className="flex items-center gap-4 w-full">
                        <button
                            className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-sm transition-colors"
                            onClick={() => setIsOpen(true)}
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        {/* Active Page Title */}
                        <div className="hidden sm:flex items-center gap-2 text-sm">
                            <span className="text-slate-400">Staff Portal</span>
                            <span className="text-slate-300">/</span>
                            <span className="font-semibold text-slate-800">
                                {pathname === "/staff/dashboard" && "Overview"}
                                {pathname.startsWith("/staff/complaints") && "All Complaints"}
                                {pathname === "/staff/heatmap" && "Heatmap"}
                                {pathname.startsWith("/staff/users") && "Citizens"}
                                {pathname.startsWith("/staff/accounts") && "User Accounts"}
                                {pathname === "/staff/stats" && "App Stats"}
                                {pathname === "/staff/train-ai" && "Train Custom AI Model"}
                                {pathname === "/staff/errors" && "System Errors"}
                            </span>
                        </div>

                        <form
                            action="/staff/complaints"
                            method="GET"
                            className="relative flex-1 max-w-sm hidden sm:block ml-auto"
                        >
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                name="q"
                                placeholder="Search complaint ID..."
                                className="pl-9 bg-slate-50 border-slate-300 h-9 rounded-sm shadow-none"
                            />
                        </form>

                        {/* Right actions */}
                        <div className="flex items-center gap-3 ml-auto shrink-0">
                            {/* Placeholders removed for strict MVP zero-tolerance audit. */}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
