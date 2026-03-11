"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ShieldAlert, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PublicHeader } from "@/components/PublicHeader";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const { account } = await import("@/lib/appwrite");
            const resetUrl = `${window.location.origin}/reset-password`;
            await account.createRecovery(email, resetUrl);
            setSent(true);
        } catch (err: any) {
            console.error("Recovery error:", err);
            if (err.code === 404) {
                // Don't reveal if email exists or not for security
                setSent(true);
            } else {
                setError(err.message || "Failed to send recovery email. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <PublicHeader />
            <div className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="mb-8 flex items-center gap-2 text-blue-700 font-bold text-2xl tracking-tight">
                    <ShieldAlert className="w-8 h-8" />
                    <span>CivicShakti</span>
                </div>

                <Card className="w-full max-w-md shadow-xl shadow-slate-200/50 border-slate-100">
                    {sent ? (
                        <>
                            <CardHeader className="space-y-2 text-center">
                                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                                </div>
                                <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
                                <CardDescription className="text-base">
                                    If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link.
                                    Please check your inbox and spam folder.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="text-center space-y-4">
                                <p className="text-sm text-slate-500">
                                    The link will expire in 1 hour. If you don&apos;t receive it, try again.
                                </p>
                                <div className="flex flex-col gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => { setSent(false); setEmail(""); }}
                                        className="w-full"
                                    >
                                        Try a different email
                                    </Button>
                                    <Link href="/login">
                                        <Button variant="ghost" className="w-full text-blue-600">
                                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </>
                    ) : (
                        <>
                            <CardHeader className="space-y-2 text-center">
                                <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
                                <CardDescription>
                                    Enter your email address and we&apos;ll send you a link to reset your password.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {error && (
                                        <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-md border border-rose-100">
                                            {error}
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
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-12 bg-blue-700 hover:bg-blue-800 text-lg shadow-md"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                        ) : (
                                            "Send Reset Link"
                                        )}
                                    </Button>

                                    <div className="text-center">
                                        <Link href="/login" className="text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors">
                                            <ArrowLeft className="w-3.5 h-3.5 inline mr-1" />
                                            Back to Login
                                        </Link>
                                    </div>
                                </form>
                            </CardContent>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
}
