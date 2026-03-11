"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, ShieldAlert, Loader2, Eye, EyeOff, CheckCircle2, ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PublicHeader } from "@/components/PublicHeader";

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const userId = searchParams.get("userId");
    const secret = searchParams.get("secret");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const isValid = password.length >= 8 && password === confirmPassword;
    const isInvalidLink = !userId || !secret;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid || isInvalidLink) return;

        setIsLoading(true);
        setError("");

        try {
            const { account } = await import("@/lib/appwrite");
            await account.updateRecovery(userId!, secret!, password);
            setSuccess(true);
        } catch (err: any) {
            console.error("Reset error:", err);
            setError(err.message || "Failed to reset password. The link may have expired.");
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
                    {success ? (
                        <>
                            <CardHeader className="space-y-2 text-center">
                                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                                </div>
                                <CardTitle className="text-2xl font-bold">Password Reset!</CardTitle>
                                <CardDescription className="text-base">
                                    Your password has been successfully updated. You can now log in with your new password.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="text-center">
                                <Link href="/login">
                                    <Button className="w-full h-12 bg-blue-700 hover:bg-blue-800 text-lg shadow-md">
                                        Go to Login
                                    </Button>
                                </Link>
                            </CardContent>
                        </>
                    ) : isInvalidLink ? (
                        <>
                            <CardHeader className="space-y-2 text-center">
                                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <AlertTriangle className="w-8 h-8 text-rose-600" />
                                </div>
                                <CardTitle className="text-2xl font-bold">Invalid Reset Link</CardTitle>
                                <CardDescription className="text-base">
                                    This password reset link is invalid or has expired.
                                    Please request a new one.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="text-center space-y-3">
                                <Link href="/forgot-password">
                                    <Button className="w-full h-12 bg-blue-700 hover:bg-blue-800 text-lg shadow-md">
                                        Request New Link
                                    </Button>
                                </Link>
                                <Link href="/login">
                                    <Button variant="ghost" className="w-full text-blue-600">
                                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
                                    </Button>
                                </Link>
                            </CardContent>
                        </>
                    ) : (
                        <>
                            <CardHeader className="space-y-2 text-center">
                                <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
                                <CardDescription>
                                    Enter your new password below. It must be at least 8 characters long.
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
                                        <Label htmlFor="password">New Password</Label>
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
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {password.length > 0 && password.length < 8 && (
                                            <p className="text-xs text-rose-500">Password must be at least 8 characters</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirm">Confirm Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <Input
                                                id="confirm"
                                                type={showPassword ? "text" : "password"}
                                                minLength={8}
                                                className="pl-9 h-12"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                        {confirmPassword.length > 0 && password !== confirmPassword && (
                                            <p className="text-xs text-rose-500">Passwords do not match</p>
                                        )}
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-12 bg-blue-700 hover:bg-blue-800 text-lg shadow-md"
                                        disabled={isLoading || !isValid}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                        ) : (
                                            "Reset Password"
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
}
