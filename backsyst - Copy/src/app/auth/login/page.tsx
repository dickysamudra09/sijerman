"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { AlertCircle, Eye, EyeOff, ArrowLeft } from "lucide-react";

interface LoginForm {
  email: string;
  password: string;
  remember?: boolean;
}

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const loginForm = useForm<LoginForm>({
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
    mode: "onBlur",
  });

  const handleLogin = async () => {
    setIsLoading(true);
    setError("");

    const { email, password } = loginForm.getValues();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
      return;
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setError("Gagal mendapatkan data user.");
      setIsLoading(false);
      return;
    }

    const userId = userData.user.id;

    const { data: userProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    const { error: profileError } = await supabase.from("users").upsert(
      {
        id: userId,
        name: userData.user.user_metadata?.full_name || "",
        email: userData.user.email || "",
        role: userProfile?.role || "student",
      },
      { onConflict: "id" }
    );
    if (profileError) {
      console.error("Error syncing profile:", profileError.message);
    }

    const authUid = (await supabase.auth.getUser()).data.user?.id;
    if (authUid && authUid === userId) {
      const { error: sessionError } = await supabase.from("sessions").insert({
        user_id: authUid,
        user_agent: navigator.userAgent,
        is_active: true,
      });

      if (sessionError) {
        setError("Gagal menyimpan sesi: " + sessionError.message);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(false);
    const role = userProfile?.role || "student";
    router.push(`/home/${role}`);
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Section: Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <img
                src="/img/1.png" 
                alt="Logo" 
                className="h-12 w-auto"
              />
              <div>
                <div className="text-xl font-bold" style={{color: '#E8B824'}}>Si Jerman</div>
                <p className="text-xs uppercase tracking-wider" style={{color: '#999999', letterSpacing: '0.05em'}}>Learning Platform</p>
              </div>
            </div>
            <Button 
              onClick={() => router.push("/")} 
              variant="ghost"
              className="flex items-center gap-2 transition-colors hover:opacity-70"
              style={{color: '#1A1A1A'}}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Kembali</span>
            </Button>
          </div>

          {/* Heading */}
          <div className="mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4" style={{color: '#1A1A1A', lineHeight: '1.3'}}>
              Masuk dan Nikmati Fitur Si Jerman
            </h1>
            <p className="text-base text-base leading-relaxed" style={{color: '#4A4A4A', lineHeight: '1.6'}}>
              Selamat datang kembali! Silahkan login untuk melanjutkan perjalanan belajar Anda.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={loginForm.handleSubmit(handleLogin)}
            className="space-y-6"
          >
            {/* Error Alert */}
            {error && (
              <div className="p-4 rounded-lg border border-red-200 bg-red-50 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label
                htmlFor="login-email"
                className="text-sm font-semibold block"
                style={{color: '#1A1A1A'}}
              >
                Email Address
              </Label>
              <div className="relative">
                <Input
                  id="login-email"
                  type="email"
                  placeholder="nama@gmail.com"
                  className="h-12 rounded-lg border-2 border-gray-200 focus:border-yellow-400 focus:ring-0 focus:outline-none pl-4 pr-10 text-base transition-colors"
                  style={{
                    backgroundColor: '#FFFFFC',
                  }}
                  {...loginForm.register("email", {
                    required: "Email wajib diisi",
                  })}
                />
                {loginForm.formState.errors.email ? (
                  <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
                ) : (
                  loginForm.getValues("email") && (
                    <svg
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5"
                      style={{color: '#E8B824'}}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 16.2L4.8 12m-1.5 1.5l6.5 6.5L23 7" strokeWidth="2" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )
                )}
              </div>
              {loginForm.formState.errors.email && (
                <p className="flex items-center gap-2 text-sm text-red-600 mt-1">
                  <AlertCircle className="h-4 w-4" />
                  {loginForm.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label
                htmlFor="login-password"
                className="text-sm font-semibold block"
                style={{color: '#1A1A1A'}}
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••"
                  className="h-12 rounded-lg border-2 border-gray-200 focus:border-yellow-400 focus:ring-0 focus:outline-none pl-4 pr-10 text-base transition-colors"
                  style={{
                    backgroundColor: '#FFFFFC',
                  }}
                  {...loginForm.register("password", {
                    required: "Password wajib diisi",
                  })}
                />
                {/* Toggle show/hide password */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:opacity-70"
                  style={{color: '#4A4A4A'}}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Error message */}
              {loginForm.formState.errors.password && (
                <p className="flex items-center gap-2 text-sm text-red-600 mt-1">
                  <AlertCircle className="h-4 w-4" />
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-sm mt-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="rounded h-4 w-4 border-2 border-gray-200 cursor-pointer"
                  style={{accentColor: '#E8B824'}}
                  {...loginForm.register("remember")}
                />
                <label htmlFor="remember" className="text-base cursor-pointer" style={{color: '#4A4A4A'}}>
                  Remember me
                </label>
              </div>
              <Button
                variant="link"
                size="sm"
                type="button"
                className="px-0 h-auto font-semibold transition-colors hover:opacity-70"
                style={{color: '#E8B824'}}
              >
                Forgot Password?
              </Button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 font-semibold text-base rounded-lg transition-all hover:opacity-90 shadow-md flex items-center justify-center gap-2"
              style={{
                backgroundColor: '#1A1A1A',
                color: '#FFFFFC'
              }}
              disabled={isLoading || !loginForm.formState.isValid}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-400 border-t-transparent"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                "LOGIN"
              )}
            </Button>

            {/* Terms */}
            <p className="text-xs text-center leading-relaxed" style={{color: '#999999'}}>
              Dengan login, Anda setuju dengan <a href="#" className="hover:underline" style={{color: '#E8B824'}}>Syarat & Ketentuan</a> dan <a href="#" className="hover:underline" style={{color: '#E8B824'}}>Kebijakan Privasi</a> kami.
            </p>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white" style={{color: '#999999'}}>atau</span>
            </div>
          </div>

          {/* Signup Link - Outside Form */}
          <p className="text-center text-base" style={{color: '#4A4A4A'}}>
            Belum punya akun? 
            <Button
              type="button"
              variant="link"
              className="ml-1 px-0 h-auto font-bold transition-colors hover:opacity-70"
              style={{color: '#E8B824'}}
              onClick={() => router.push("/auth/register")}
            >
              Daftar di sini
            </Button>
          </p>
        </div>
      </div>

      {/* Right Section: Branding Visual */}
      <div className="flex-1 bg-gradient-to-br from-[#1A1A1A] via-[#2A2A2A] to-[#1A1A1A] relative overflow-hidden hidden md:flex items-center justify-center p-8">
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-40 h-40 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 text-center text-white max-w-md">
          <div className="mb-8">
            <img src="/img/1.png" alt="Si Jerman" className="h-24 w-auto mx-auto mb-6" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">
            Selamat Datang di <br />
            <span style={{color: '#E8B824'}}>Si Jerman</span>
          </h2>
          <p className="text-base text-gray-300 mb-8 leading-relaxed">
            Platform pembelajaran Bahasa Jerman terlengkap dengan AI, kuis interaktif, forum diskusi, dan banyak lagi.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-200">
              <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#E8B824'}}></div>
              <span>Latihan soal dengan analisis AI</span>
            </div>
            <div className="flex items-center gap-3 text-gray-200">
              <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#E8B824'}}></div>
              <span>Kuis interaktif dan multiplayer</span>
            </div>
            <div className="flex items-center gap-3 text-gray-200">
              <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#E8B824'}}></div>
              <span>Dashboard tracking progress</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}