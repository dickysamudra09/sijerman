"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { AlertCircle, Eye, EyeOff, ArrowLeft, CheckCircle, UserPlus, LogIn, Search, FileText, MousePointerClick, PenTool, Sparkles, BarChart3 } from "lucide-react";
import { createSession, enforceSessionLimit, logSessionActivity } from "@/lib/session-manager";
import { createSessionSimple } from "@/lib/session-manager-simple";
import { getUserIP } from "@/lib/get-ip";

interface LoginForm {
  email: string;
  password: string;
  remember?: boolean;
}

const useFormAnimation = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);
  
  return isVisible;
};

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegistered = searchParams?.get("registered") === "true";
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successNotification, setSuccessNotification] = useState(isRegistered);
  const isVisible = useFormAnimation();

  useEffect(() => {
    if (successNotification) {
      const timer = setTimeout(() => {
        setSuccessNotification(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successNotification]);
  const loginForm = useForm<LoginForm>({
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
    mode: "onChange",
  });

  const handleLogin = async () => {
    setIsLoading(true);
    setError("");

    try {
      const { email, password } = loginForm.getValues();
      console.log("Login attempt:", { email });

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error("SignIn error:", signInError.message);
        setError(signInError.message);
        setIsLoading(false);
        return;
      }

      console.log("Authentication successful");

      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        console.error("Error getting user data:", userError?.message);
        setError("Gagal mendapatkan data user.");
        setIsLoading(false);
        return;
      }

      const userId = userData.user.id;
      console.log("User ID:", userId);

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
        console.warn("Error syncing profile:", profileError.message);
      } else {
        console.log("User profile synced");
      }

      const userIP = await getUserIP();
      console.log("User IP:", userIP);

      console.log('Session creation temporarily disabled - continuing login');
      let sessionData = { id: 'temp-session-disabled' }; 

      console.log("Session limit enforcement temporarily disabled");

      console.log("Activity logging temporarily disabled");

      setIsLoading(false);
      
      // Check if there's a redirect URL from query params (e.g., from course enrollment)
      const redirectUrl = searchParams?.get('redirect');
      
      if (redirectUrl && redirectUrl.startsWith('/')) {
        // Security check: only allow internal redirects (starts with /)
        console.log("Redirecting to:", redirectUrl);
        router.push(redirectUrl);
      } else {
        // Default redirect based on user role
        const role = userProfile?.role || "student";
        console.log("Redirecting to dashboard for role:", role);
        router.push(`/home/${role}`);
      }

    } catch (error) {
      console.error("Unexpected error during login:", error);
      setError("Terjadi kesalahan yang tidak terduga. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Section: Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-8 lg:p-12 relative overflow-hidden" style={{background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,253,248,1) 100%)'}}>
        {/* Decorative Blobs */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232, 184, 36, 0.08) 0%, rgba(232, 184, 36, 0) 70%)',
          filter: 'blur(80px)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-15%',
          left: '-8%',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.06) 0%, rgba(245, 158, 11, 0) 70%)',
          filter: 'blur(80px)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />

        <div className="w-full max-w-md relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-12" style={{animation: isVisible ? 'fadeSlideDown 0.6s ease-out forwards' : 'none'}}>
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
              className="flex items-center gap-2 transition-all duration-300 hover:opacity-70"
              style={{color: '#1A1A1A'}}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Kembali</span>
            </Button>
          </div>

          {/* Heading */}
          <div className="mb-12" style={{animation: isVisible ? 'fadeSlideDown 0.6s ease-out 0.1s forwards' : 'none', opacity: isVisible ? 1 : 0}}>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4" style={{color: '#1A1A1A', lineHeight: '1.3'}}>
              Masuk dan Nikmati Fitur Si Jerman
            </h1>
            <p className="text-base text-base leading-relaxed" style={{color: '#4A4A4A', lineHeight: '1.6'}}>
              Selamat datang kembali! Silahkan login untuk melanjutkan perjalanan belajar Anda.
            </p>
          </div>

          {/* Success Notification - Registration */}
          {successNotification && (
            <div 
              className="mb-6 p-4 rounded-lg border-2 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300"
              style={{
                borderColor: '#22C55E',
                backgroundColor: 'rgba(34, 197, 94, 0.08)',
                animation: 'fadeSlideDown 0.5s ease-out forwards'
              }}
            >
              <CheckCircle className="h-5 w-5 flex-shrink-0" style={{color: '#22C55E'}} />
              <p className="text-sm font-medium" style={{color: '#166534'}}>
                Pendaftaran berhasil! Silakan login dengan akun Anda.
              </p>
              <button
                onClick={() => setSuccessNotification(false)}
                className="ml-auto text-sm opacity-70 hover:opacity-100 transition-opacity"
                style={{color: '#166534'}}
              >
                ✕
              </button>
            </div>
          )}

          {/* Glassmorphic Form Card */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 252, 0.7)',
            borderRadius: '20px',
            border: '1px solid rgba(232, 184, 36, 0.15)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            padding: '32px 24px',
            boxShadow: '0 8px 32px rgba(232, 184, 36, 0.08)',
            animation: isVisible ? 'fadeScaleIn 0.7s ease-out 0.2s forwards' : 'none',
            opacity: isVisible ? 1 : 0
          }}>
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
                  className="h-12 rounded-lg border-2 focus:ring-0 focus:outline-none pl-4 pr-10 text-base transition-all duration-300"
                  style={{
                    backgroundColor: '#FFFFFC',
                    borderColor: '#E8B824'
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
                  className="h-12 rounded-lg border-2 focus:ring-0 focus:outline-none pl-4 pr-10 text-base transition-all duration-300"
                  style={{
                    backgroundColor: '#FFFFFC',
                    borderColor: '#E8B824'
                  }}
                  {...loginForm.register("password", {
                    required: "Password wajib diisi",
                  })}
                />
                {/* Toggle show/hide password */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-300 hover:opacity-70"
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
                  className="rounded h-4 w-4 border-2 border-gray-200 cursor-pointer transition-all duration-300"
                  style={{accentColor: '#E8B824'}}
                  {...loginForm.register("remember")}
                />
                <label htmlFor="remember" className="text-base cursor-pointer transition-colors duration-300" style={{color: '#4A4A4A'}}>
                  Remember me
                </label>
              </div>
              <Button
                variant="link"
                size="sm"
                type="button"
                className="px-0 h-auto font-semibold transition-all duration-300 hover:opacity-70"
                style={{color: '#E8B824'}}
              >
                Forgot Password?
              </Button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 font-semibold text-base rounded-lg transition-all duration-300 shadow-md flex items-center justify-center gap-2"
              style={{
                backgroundColor: '#1A1A1A',
                color: '#FFFFFC'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(232, 184, 36, 0.2)';
                e.currentTarget.style.backgroundColor = '#E8B824';
                e.currentTarget.style.color = '#1A1A1A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.backgroundColor = '#1A1A1A';
                e.currentTarget.style.color = '#FFFFFC';
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
              Dengan login, Anda setuju dengan <a href="#" className="hover:underline transition-colors duration-300" style={{color: '#E8B824'}}>Syarat & Ketentuan</a> dan <a href="#" className="hover:underline transition-colors duration-300" style={{color: '#E8B824'}}>Kebijakan Privasi</a> kami.
            </p>
            </form>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-gradient-to-b from-white to-[#FFFDF8]" style={{color: '#999999'}}>atau</span>
            </div>
          </div>

          {/* Signup Link - Outside Form */}
          <p className="text-center text-base" style={{color: '#4A4A4A'}}>
            Belum punya akun? 
            <Button
              type="button"
              variant="link"
              className="ml-1 px-0 h-auto font-bold transition-all duration-300 hover:opacity-70"
              style={{color: '#E8B824'}}
              onClick={() => router.push("/auth/register")}
            >
              Daftar di sini
            </Button>
          </p>
        </div>
      </div>

      {/* Right Section: Branding Visual */}
      <div className="flex-1 bg-gradient-to-br from-[#1A1A1A] via-[#2A2A2A] to-[#1A1A1A] relative overflow-hidden hidden md:flex items-center justify-center p-8 sticky top-0 h-screen">
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-40 h-40 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 text-white max-w-lg px-4">
          {/* Logo with Title - Center */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <img src="/img/1.png" alt="Si Jerman" className="h-12 w-auto" />
              <div className="text-left">
                <div className="text-xl font-bold" style={{color: '#E8B824'}}>Si Jerman</div>
                <p className="text-xs uppercase tracking-wider" style={{color: '#FFFFFC', letterSpacing: '0.05em'}}>Learning Platform</p>
              </div>
            </div>
          </div>

          {/* Vertical Timeline - Alur Penggunaan (8 Steps) - Center */}
          <div className="relative text-center">
            <h3 className="text-xl font-bold mb-2" style={{color: '#E8B824'}}>
              Alur Penggunaan Open Course
            </h3>
            <p className="text-sm text-gray-400 mb-10">
              Ikuti 8 langkah untuk memulai pembelajaran Bahasa Jerman
            </p>
            
            {/* Timeline container - Center aligned with adjusted positioning */}
            <div className="inline-block text-left relative">
              {/* Vertical line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-700"></div>
              
              {/* Step 1: Daftar akun */}
              <div className="relative mb-6 flex items-start gap-3">
                <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: '#3B82F6', boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.2)'}}>
                  <UserPlus className="h-5 w-5 text-white" />
                </div>
                <div className="pt-1.5">
                  <h4 className="font-semibold text-base mb-0.5 text-white">Daftar akun</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">Buat akun baru dengan email</p>
                </div>
              </div>
              
              {/* Step 2: Masuk akun */}
              <div className="relative mb-6 flex items-start gap-3">
                <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: '#06B6D4', boxShadow: '0 0 0 3px rgba(6, 182, 212, 0.2)'}}>
                  <LogIn className="h-5 w-5 text-white" />
                </div>
                <div className="pt-1.5">
                  <h4 className="font-semibold text-base mb-0.5 text-white">Masuk akun</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">Login ke sistem platform</p>
                </div>
              </div>
              
              {/* Step 3: Melihat daftar open course */}
              <div className="relative mb-6 flex items-start gap-3">
                <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: '#10B981', boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)'}}>
                  <Search className="h-5 w-5 text-white" />
                </div>
                <div className="pt-1.5">
                  <h4 className="font-semibold text-base mb-0.5 text-white">Melihat daftar open course</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">Browse kursus yang tersedia</p>
                </div>
              </div>
              
              {/* Step 4: Melihat silabus kursus */}
              <div className="relative mb-6 flex items-start gap-3">
                <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: '#14B8A6', boxShadow: '0 0 0 3px rgba(20, 184, 166, 0.2)'}}>
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div className="pt-1.5">
                  <h4 className="font-semibold text-base mb-0.5 text-white">Melihat silabus kursus</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">Baca detail materi kursus</p>
                </div>
              </div>
              
              {/* Step 5: Mengakses detail kursus */}
              <div className="relative mb-6 flex items-start gap-3">
                <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: '#F59E0B', boxShadow: '0 0 0 3px rgba(245, 158, 11, 0.2)'}}>
                  <MousePointerClick className="h-5 w-5 text-white" />
                </div>
                <div className="pt-1.5">
                  <h4 className="font-semibold text-base mb-0.5 text-white">Mengakses detail kursus</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">Buka halaman kursus</p>
                </div>
              </div>
              
              {/* Step 6: Mengerjakan latihan soal */}
              <div className="relative mb-6 flex items-start gap-3">
                <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: '#F97316', boxShadow: '0 0 0 3px rgba(249, 115, 22, 0.2)'}}>
                  <PenTool className="h-5 w-5 text-white" />
                </div>
                <div className="pt-1.5">
                  <h4 className="font-semibold text-base mb-0.5 text-white">Mengerjakan latihan soal</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">Kerjakan exercise pembelajaran</p>
                </div>
              </div>
              
              {/* Step 7: Menerima AI Feedback */}
              <div className="relative mb-6 flex items-start gap-3">
                <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: '#8B5CF6', boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.2)'}}>
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="pt-1.5">
                  <h4 className="font-semibold text-base mb-0.5 text-white">Menerima AI Feedback</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">Dapat penilaian otomatis dari AI</p>
                </div>
              </div>
              
              {/* Step 8: Melihat progress belajar */}
              <div className="relative flex items-start gap-3">
                <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: '#EC4899', boxShadow: '0 0 0 3px rgba(236, 72, 153, 0.2)'}}>
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div className="pt-1.5">
                  <h4 className="font-semibold text-base mb-0.5 text-white">Melihat progress belajar</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">Tracking kemajuan pembelajaran</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// Wrapper component with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <LoginPageInner />
    </Suspense>
  );
}
