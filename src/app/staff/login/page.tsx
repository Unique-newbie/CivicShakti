"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldAlert, Lock, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { account } from "@/lib/appwrite";
import { syncSessionCookie } from "@/lib/auth-helpers";

import { PublicHeader } from "@/components/PublicHeader";

import { Suspense } from "react";

function StaffLoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectPath = searchParams.get("redirect") || "/staff/dashboard";
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        account.get().then(async (session) => {
            if (session.email.endsWith("@civicshakti.gov") || session.email.endsWith("@civicshakti.com")) {
                await syncSessionCookie();
                window.location.href = redirectPath;
            }
        }).catch(() => {
            // Not logged in, stay here
        });
    }, [redirectPath]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            if (!email.endsWith("@civicshakti.gov") && !email.endsWith("@civicshakti.com")) {
                throw new Error("Unauthorized domain. Official staff emails only.");
            }
            await account.createEmailPasswordSession(email, password);
            await syncSessionCookie();
            window.location.href = redirectPath;
        } catch (err: any) {
            if (err.message && err.message.includes('Creation of a session is prohibited when a session is active')) {
                await syncSessionCookie();
                window.location.href = redirectPath;
            } else {
                console.error("Staff Login Error:", err);
                setError(err.message || "Invalid credentials. Are you authorized?");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
            <PublicHeader />

            <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full">
                <div className="mb-8 flex items-center gap-2 text-blue-700 font-bold text-2xl tracking-tight">
                    <ShieldAlert className="w-8 h-8" />
                    <span>CivicShakti Authority</span>
                </div>

                <Card className="w-full max-w-md shadow-xl shadow-slate-200/50 border-slate-100">
                    <CardHeader className="space-y-2 text-center">
                        <CardTitle className="text-2xl font-bold">Staff Login</CardTitle>
                        <CardDescription>
                            Enter your official credentials to access the management dashboard.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            {error && (
                                <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-md border border-rose-100">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">Official Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@civicshakti.gov"
                                        className="pl-9 h-12"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        id="password"
                                        type="password"
                                        className="pl-9 h-12"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-12 bg-blue-700 hover:bg-blue-800 text-lg shadow-md" disabled={isLoading}>
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Authenticate"}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex justify-center text-sm text-slate-500 border-t border-slate-100 pt-6">
                        Authorized personnel only. All access is logged.
                    </CardFooter>
                </Card>
            </main>


        </div>
    );
}

export default function StaffLogin() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
            <StaffLoginContent />
        </Suspense>
    );
}
