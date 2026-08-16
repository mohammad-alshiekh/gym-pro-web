"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, Dumbbell } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import { authApi } from "@/lib/api";
import { saveAuth } from "@/lib/auth";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

type AuthMode = "login" | "forgot" | "reset";
type RoleTab = "super_admin" | "gym_manager";

export default function LoginPage() {
  const router = useRouter();
  const { t, locale, isRtl } = useTranslation();
  const setLocale = useAppStore((s) => s.setLocale);

  const [activeRole, setActiveRole] = useState<RoleTab>("super_admin");
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      let response;
      if (activeRole === "super_admin") {
        response = await authApi.superAdminLogin(data.email, data.password);
      } else {
        response = await authApi.gymManagerLogin(data.email, data.password);
      }

      const { accessToken, refreshToken } = response.data;
      saveAuth({
        role: activeRole,
        accessToken,
        refreshToken,
      });

      toast.success(t.auth.loginSuccess);

      if (activeRole === "super_admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/manager/dashboard");
      }
    } catch {
      toast.error(t.auth.invalidCredentials);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) return;
    setLoading(true);
    try {
      await authApi.gymManagerForgotPassword(forgotEmail);
      toast.success("Reset instructions sent to your email");
      setMode("reset");
      setResetEmail(forgotEmail);
    } catch {
      toast.error("Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetOtp || !resetNewPassword) return;
    setLoading(true);
    try {
      await authApi.gymManagerResetPassword(resetEmail, resetOtp, resetNewPassword);
      toast.success(t.auth.passwordResetSuccess);
      setMode("login");
    } catch {
      toast.error("Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "#0a0a0a" }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(202,253,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(202,253,0,0.3) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Glow effect */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: "#cafd00" }}
      />

      {/* Lang switcher */}
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <button
          onClick={() => setLocale("en")}
          className={cn(
            "px-3 py-1 rounded-full text-sm font-mono font-medium transition-all",
            locale === "en"
              ? "bg-[#cafd00] text-[#3a4a00]"
              : "text-[#adaaaa] border border-[#2a2a2a] hover:border-[#cafd00]"
          )}
        >
          EN
        </button>
        <button
          onClick={() => setLocale("ar")}
          className={cn(
            "px-3 py-1 rounded-full text-sm font-mono font-medium transition-all",
            locale === "ar"
              ? "bg-[#cafd00] text-[#3a4a00]"
              : "text-[#adaaaa] border border-[#2a2a2a] hover:border-[#cafd00]"
          )}
        >
          AR
        </button>
      </div>

      {/* Card */}
      <div
        className="relative w-full max-w-md mx-4 rounded-3xl p-8 border"
        style={{
          background: "#131313",
          borderColor: "#2a2a2a",
          boxShadow: "0px 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "#cafd00" }}
          >
            <Dumbbell className="w-6 h-6" style={{ color: "#3a4a00" }} />
          </div>
          <div>
            <h1
              className="text-xl font-bold leading-tight"
              style={{
                fontFamily: "Lexend, sans-serif",
                color: "#ffffff",
              }}
            >
              {t.common.appName}
            </h1>
            <p className="text-xs" style={{ color: "#8a8888", fontFamily: "JetBrains Mono, monospace" }}>
              {t.common.tagline}
            </p>
          </div>
        </div>

        {/* Welcome text */}
        <div className="mb-6">
          <h2
            className="text-3xl font-bold mb-2"
            style={{ fontFamily: "Space Grotesk, sans-serif", color: "#ffffff" }}
          >
            {mode === "login" && t.auth.welcomeBack}
            {mode === "forgot" && t.auth.forgotPassword}
            {mode === "reset" && t.auth.resetPassword}
          </h2>
          <p className="text-sm" style={{ color: "#8a8888" }}>
            {mode === "login" && t.auth.tagline}
            {mode === "forgot" && t.auth.resetInstructions}
            {mode === "reset" && t.auth.otpSent}
          </p>
        </div>

        {/* Role Selector — only on login */}
        {mode === "login" && (
          <div
            className="flex rounded-full p-1 mb-6"
            style={{ background: "#0e0e0e", border: "1px solid #2a2a2a" }}
          >
            <button
              onClick={() => setActiveRole("super_admin")}
              className={cn(
                "flex-1 py-2.5 rounded-full text-sm font-semibold transition-all",
                activeRole === "super_admin"
                  ? "shadow-md"
                  : "opacity-60 hover:opacity-80"
              )}
              style={{
                fontFamily: "Lexend, sans-serif",
                background: activeRole === "super_admin" ? "#cafd00" : "transparent",
                color: activeRole === "super_admin" ? "#3a4a00" : "#ffffff",
              }}
            >
              {t.auth.superAdmin}
            </button>
            <button
              onClick={() => setActiveRole("gym_manager")}
              className={cn(
                "flex-1 py-2.5 rounded-full text-sm font-semibold transition-all",
                activeRole === "gym_manager"
                  ? "shadow-md"
                  : "opacity-60 hover:opacity-80"
              )}
              style={{
                fontFamily: "Lexend, sans-serif",
                background: activeRole === "gym_manager" ? "#cafd00" : "transparent",
                color: activeRole === "gym_manager" ? "#3a4a00" : "#ffffff",
              }}
            >
              {t.auth.gymManager}
            </button>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === "login" && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5 uppercase tracking-widest"
                style={{ fontFamily: "JetBrains Mono, monospace", color: "#adaaaa" }}
              >
                {t.auth.emailAddress}
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "#8a8888" }}
                />
                <input
                  {...register("email")}
                  type="email"
                  placeholder={t.auth.enterEmail}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border text-sm transition-all input-accent"
                  style={{
                    background: "#0e0e0e",
                    borderColor: errors.email ? "#ff6e81" : "#2a2a2a",
                    color: "#ffffff",
                    fontFamily: "Manrope, sans-serif",
                    outline: "none",
                  }}
                />
              </div>
              {errors.email && (
                <p className="text-xs mt-1" style={{ color: "#ff6e81" }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5 uppercase tracking-widest"
                style={{ fontFamily: "JetBrains Mono, monospace", color: "#adaaaa" }}
              >
                {t.auth.password}
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "#8a8888" }}
                />
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder={t.auth.enterPassword}
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl border text-sm transition-all input-accent"
                  style={{
                    background: "#0e0e0e",
                    borderColor: errors.password ? "#ff6e81" : "#2a2a2a",
                    color: "#ffffff",
                    fontFamily: "Manrope, sans-serif",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:text-[#cafd00]"
                  style={{ color: "#8a8888" }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            {activeRole === "gym_manager" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-sm font-medium hover:underline transition-colors"
                  style={{ color: "#cafd00", fontFamily: "Lexend, sans-serif" }}
                >
                  {t.auth.forgotPassword}
                </button>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              {t.auth.login}
            </Button>
          </form>
        )}

        {/* FORGOT PASSWORD */}
        {mode === "forgot" && (
          <div className="space-y-4">
            <div>
              <label
                className="block text-xs font-medium mb-1.5 uppercase tracking-widest"
                style={{ fontFamily: "JetBrains Mono, monospace", color: "#adaaaa" }}
              >
                {t.auth.emailAddress}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8a8888" }} />
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder={t.auth.enterEmail}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border text-sm input-accent"
                  style={{
                    background: "#0e0e0e",
                    borderColor: "#2a2a2a",
                    color: "#ffffff",
                    outline: "none",
                  }}
                />
              </div>
            </div>
            <Button type="button" size="lg" loading={loading} onClick={handleForgotPassword} className="w-full">
              {t.auth.sendResetLink}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setMode("login")} className="w-full">
              {t.auth.backToLogin}
            </Button>
          </div>
        )}

        {/* RESET PASSWORD */}
        {mode === "reset" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 uppercase tracking-widest" style={{ fontFamily: "JetBrains Mono, monospace", color: "#adaaaa" }}>
                {t.auth.otpCode}
              </label>
              <input
                type="text"
                value={resetOtp}
                onChange={(e) => setResetOtp(e.target.value)}
                placeholder={t.auth.enterOtp}
                maxLength={6}
                className="w-full px-4 py-3.5 rounded-xl border text-sm text-center tracking-[0.5em] input-accent"
                style={{ background: "#0e0e0e", borderColor: "#2a2a2a", color: "#ffffff", outline: "none" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 uppercase tracking-widest" style={{ fontFamily: "JetBrains Mono, monospace", color: "#adaaaa" }}>
                {t.auth.newPassword}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8a8888" }} />
                <input
                  type={showResetPassword ? "text" : "password"}
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder={t.auth.enterNewPassword}
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl border text-sm input-accent"
                  style={{ background: "#0e0e0e", borderColor: "#2a2a2a", color: "#ffffff", outline: "none" }}
                />
                <button
                  type="button"
                  onClick={() => setShowResetPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:text-[#cafd00]"
                  style={{ color: "#8a8888" }}
                >
                  {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="button" size="lg" loading={loading} onClick={handleResetPassword} className="w-full">
              {t.auth.resetPassword}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setMode("login")}
              className="w-full"
            >
              {t.auth.backToLogin}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
