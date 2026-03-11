"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getAuthJWT } from "@/lib/auth-helpers";
import { Loader2, Mail, Lock, User, ShieldAlert, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/context/LanguageContext";
import { PublicHeader } from "@/components/PublicHeader";


export default function Login() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}

function getPasswordStrength(password: string): { label: string; color: string; width: string } {
    if (!password) return { label: "", color: "", width: "0%" };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { label: "Weak", color: "bg-rose-500", width: "20%" };
    if (score <= 2) return { label: "Fair", color: "bg-amber-500", width: "40%" };
    if (score <= 3) return { label: "Good", color: "bg-blue-500", width: "65%" };
    if (score <= 4) return { label: "Strong", color: "bg-emerald-500", width: "85%" };
    return { label: "Very Strong", color: "bg-emerald-600", width: "100%" };
}

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t } = useLanguage();
    const redirectPath = searchParams.get("redirect") || "/dashboard";
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Check if already logged in
    useEffect(() => {
        async function checkExisting() {
            const token = await getAuthJWT();
            if (!token) return;
            try {
                const res = await fetch('/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    window.location.href = redirectPath;
                }
            } catch {
                // Not logged in
            }
        }
        checkExisting();
    }, [redirectPath]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const { account } = await import('@/lib/appwrite');
            const { syncSessionCookie } = await import('@/lib/auth-helpers');

            if (isLogin) {
                await account.createEmailPasswordSession(email, password);
                await syncSessionCookie();
                window.location.href = redirectPath;
            } else {
                const { ID } = await import('appwrite');
                await account.create(ID.unique(), email, password, name);
                await account.createEmailPasswordSession(email, password);
                await syncSessionCookie();

                // Auto-create profile document
                try {
                    const token = await import('@/lib/auth-helpers').then(m => m.getAuthJWT());
                    if (token) {
                        await fetch('/api/profile', {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({ full_name: name }),
                        });
                    }
                } catch {
                    // Profile will be created later
                }

                window.location.href = redirectPath;
            }
        } catch (err: any) {
            console.error("Auth error:", err);
            setError(err.message || t("login.authFailed"));
        } finally {
            setIsLoading(false);
        }
    };

    const strength = getPasswordStrength(password);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
            <PublicHeader />
            <div className="flex-1 flex flex-col items-center justify-center p-4 z-10 w-full">
                <div className="mb-8 flex items-center gap-2 text-blue-700 font-bold text-2xl tracking-tight">
                    <ShieldAlert className="w-8 h-8" />
                    <span>CivicShakti</span>
                </div>

                <Card className="w-full max-w-md shadow-xl shadow-slate-200/50 border-slate-100">
                    <CardHeader className="space-y-2 text-center">
                        <CardTitle className="text-2xl font-bold">{isLogin ? t("login.welcomeBack") : t("login.createAccount")}</CardTitle>
                        <CardDescription>
                            {isLogin ? t("login.loginDesc") : t("login.signupDesc")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-md border border-rose-100">
                                    {error}
                                </div>
                            )}

                            {!isLogin && (
                                <div className="space-y-2">
                                    <Label htmlFor="name">{t("common.fullName")}</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            id="name"
                                            type="text"
                                            placeholder="John Doe"
                                            className="pl-9 h-12"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required={!isLogin}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">{t("common.email")}</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        className="pl-9 h-12"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">{t("common.password")}</Label>
                                    {isLogin && (
                                        <Link href="/forgot-password" className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                                            Forgot password?
                                        </Link>
                                    )}
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        minLength={8}
                                        className="pl-9 pr-10 h-12"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>

                                {/* Password Strength Indicator (signup only) */}
                                {!isLogin && password.length > 0 && (
                                    <div className="space-y-1.5 pt-1">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                                                    style={{ width: strength.width }}
                                                />
                                            </div>
                                            <span className={`text-xs font-medium ${
                                                strength.label === 'Weak' ? 'text-rose-500' :
                                                strength.label === 'Fair' ? 'text-amber-500' :
                                                strength.label === 'Good' ? 'text-blue-500' :
                                                'text-emerald-500'
                                            }`}>
                                                {strength.label}
                                            </span>
                                        </div>
                                        {password.length < 8 && (
                                            <p className="text-xs text-slate-400">Minimum 8 characters required</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <Button type="submit" className="w-full h-12 bg-blue-700 hover:bg-blue-800 text-lg shadow-md" disabled={isLoading}>
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (isLogin ? t("common.login") : t("common.signup"))}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex justify-center text-sm text-slate-500 border-t border-slate-100 pt-6">
                        <button
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError("");
                                setPassword("");
                            }}
                            className="hover:text-blue-600 font-medium transition-colors"
                            type="button"
                        >
                            {isLogin ? t("common.noAccount") : t("common.hasAccount")}
                        </button>
                    </CardFooter>
                </Card>
            </div>

        </div>
    );
}
