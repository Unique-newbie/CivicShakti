"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { account } from "@/lib/appwrite";
import { ID } from "appwrite";
import { syncSessionCookie } from "@/lib/auth-helpers";
import { Loader2, Mail, Lock, User, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Footer } from "@/components/Footer";

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

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectPath = searchParams.get("redirect") || "/dashboard";
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        account.get().then(async () => {
            await syncSessionCookie();
            window.location.href = redirectPath;
        }).catch(() => {
            // Not logged in, stay here
        });
    }, [redirectPath]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            if (isLogin) {
                await account.createEmailPasswordSession(email, password);
            } else {
                await account.create(ID.unique(), email, password, name);
                await account.createEmailPasswordSession(email, password);
            }
            await syncSessionCookie();
            window.location.href = redirectPath;
        } catch (err: any) {
            // If already logged in, just proceed
            if (err.message && err.message.includes('Creation of a session is prohibited when a session is active')) {
                await syncSessionCookie();
                window.location.href = redirectPath;
            } else {
                console.error("Auth error:", err);
                setError(err.message || "Authentication failed. Please check your credentials.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
            <div className="flex-1 flex flex-col items-center justify-center p-4 z-10 w-full">
                <div className="mb-8 flex items-center gap-2 text-blue-700 font-bold text-2xl tracking-tight">
                    <ShieldAlert className="w-8 h-8" />
                    <span>CivicShakti</span>
                </div>

                <Card className="w-full max-w-md shadow-xl shadow-slate-200/50 border-slate-100">
                    <CardHeader className="space-y-2 text-center">
                        <CardTitle className="text-2xl font-bold">{isLogin ? "Welcome Back" : "Create Account"}</CardTitle>
                        <CardDescription>
                            {isLogin ? "Log in to track your complaints faster." : "Sign up to start reporting issues in your city."}
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
                                    <Label htmlFor="name">Full Name</Label>
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
                                <Label htmlFor="email">Email Address</Label>
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
                                    <Label htmlFor="password">Password</Label>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        id="password"
                                        type="password"
                                        minLength={8}
                                        className="pl-9 h-12"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-12 bg-blue-700 hover:bg-blue-800 text-lg shadow-md" disabled={isLoading}>
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (isLogin ? "Log In" : "Sign Up")}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex justify-center text-sm text-slate-500 border-t border-slate-100 pt-6">
                        <button
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError("");
                            }}
                            className="hover:text-blue-600 font-medium transition-colors"
                            type="button"
                        >
                            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
                        </button>
                    </CardFooter>
                </Card>
            </div>

            <Footer />
        </div >
    );
}
