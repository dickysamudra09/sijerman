"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, ArrowLeft } from "lucide-react";

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "teacher" | "student";
  terms: boolean;
}

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const registerForm = useForm<RegisterForm>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "student",
      terms: false,
    },
    mode: "onBlur",
  });

  const handleRegister = async () => {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    const { name, email, password, role } = registerForm.getValues();
    console.log("Register attempt with:", { name, email, role });

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });
    console.log("SignUp response:", { data: signUpData, error: signUpError });

    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
      return;
    }

    const userId = signUpData.user?.id;
    if (!userId) {
      setError("Gagal mendapatkan ID user.");
      setIsLoading(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("users")
      .insert({
        id: userId,
        name,
        email,
        role,
      });
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
      console.log("Session insert:", { error: sessionError });

      if (sessionError) {
        setError("Gagal menyimpan sesi: " + sessionError.message);
        setIsLoading(false);
        return;
      }
    } else {
      console.warn("Authentication UID not available after signUp, skipping session insert.");
    }

    setIsLoading(false);
    if (signUpData.user?.confirmation_sent_at) {
      setSuccessMessage("Pendaftaran berhasil! Silakan verifikasi email Anda untuk login.");
      setTimeout(() => router.push("/auth/login"), 2000);
    } else {
      router.push("/home");
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Section: Branding Visual - Fixed */}
      <div className="flex-1 bg-gradient-to-br from-[#1A1A1A] via-[#2A2A2A] to-[#1A1A1A] relative overflow-hidden hidden md:flex items-center justify-center p-8 sticky top-0 h-screen">
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
            Bergabunglah di <br />
            <span style={{color: '#E8B824'}}>Si Jerman</span>
          </h2>
          <p className="text-base text-gray-300 mb-8 leading-relaxed">
            Platform pembelajaran Bahasa Jerman terlengkap dengan AI, kuis interaktif, forum diskusi, dan banyak lagi.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-200">
              <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#E8B824' }}></div>
              <span>Latihan soal dengan analisis AI</span>
            </div>
            <div className="flex items-center gap-3 text-gray-200">
              <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#E8B824' }}></div>
              <span>Kuis interaktif dan multiplayer</span>
            </div>
            <div className="flex items-center gap-3 text-gray-200">
              <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#E8B824' }}></div>
              <span>Dashboard tracking progress</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section: Register Form - Scrollable */}
      <div className="flex-1 flex flex-col overflow-y-auto p-6 md:p-8 lg:p-12">
        <div className="w-full max-w-md mx-auto flex flex-col min-h-full justify-center">
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
              Buat Akun Baru dan Mulai Belajar
            </h1>
            <p className="text-base leading-relaxed" style={{color: '#4A4A4A', lineHeight: '1.6'}}>
              Selamat datang! Silahkan daftar untuk membuat akun Anda.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={registerForm.handleSubmit(handleRegister)}
            className="space-y-6"
          >
            {/* Error Alert */}
            {error && (
              <div className="p-4 rounded-lg border border-red-200 bg-red-50 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            {successMessage && (
              <div className="p-4 rounded-lg border border-green-200 bg-green-50 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            )}

            {/* Role Field */}
            <div className="space-y-2">
              <Label
                htmlFor="register-role"
                className="text-sm font-semibold block"
                style={{color: '#1A1A1A'}}
              >
                Daftar Sebagai
              </Label>
              <select
                id="register-role"
                className="w-full h-12 rounded-lg border-2 border-gray-200 focus:border-yellow-400 focus:ring-0 focus:outline-none px-4 text-base transition-colors cursor-pointer"
                style={{
                  backgroundColor: '#FFFFFC',
                  color: '#1A1A1A'
                }}
                {...registerForm.register("role", { required: "Pilih peran Anda" })}
              >
                <option value="">Pilih peran Anda</option>
                <option value="teacher">Guru</option>
                <option value="student">Siswa</option>
              </select>
              {registerForm.formState.errors.role && (
                <p className="flex items-center gap-2 text-sm text-red-600 mt-1">
                  <AlertCircle className="h-4 w-4" />
                  {registerForm.formState.errors.role.message}
                </p>
              )}
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <Label
                htmlFor="register-name"
                className="text-sm font-semibold block"
                style={{color: '#1A1A1A'}}
              >
                Nama Lengkap
              </Label>
              <div className="relative">
                <Input
                  id="register-name"
                  type="text"
                  placeholder="Masukkan nama lengkap Anda"
                  className="h-12 rounded-lg border-2 border-gray-200 focus:border-yellow-400 focus:ring-0 focus:outline-none pl-4 pr-10 text-base transition-colors"
                  style={{
                    backgroundColor: '#FFFFFC',
                  }}
                  {...registerForm.register("name", { required: "Nama wajib diisi" })}
                />
                {registerForm.formState.errors.name ? (
                  <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
                ) : (
                  registerForm.getValues("name") && (
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
              {registerForm.formState.errors.name && (
                <p className="flex items-center gap-2 text-sm text-red-600 mt-1">
                  <AlertCircle className="h-4 w-4" />
                  {registerForm.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label
                htmlFor="register-email"
                className="text-sm font-semibold block"
                style={{color: '#1A1A1A'}}
              >
                Email Address
              </Label>
              <div className="relative">
                <Input
                  id="register-email"
                  type="email"
                  placeholder="nama@gmail.com"
                  className="h-12 rounded-lg border-2 border-gray-200 focus:border-yellow-400 focus:ring-0 focus:outline-none pl-4 pr-10 text-base transition-colors"
                  style={{
                    backgroundColor: '#FFFFFC',
                  }}
                  {...registerForm.register("email", { required: "Email wajib diisi" })}
                />
                {registerForm.formState.errors.email ? (
                  <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
                ) : (
                  registerForm.getValues("email") && (
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
              {registerForm.formState.errors.email && (
                <p className="flex items-center gap-2 text-sm text-red-600 mt-1">
                  <AlertCircle className="h-4 w-4" />
                  {registerForm.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label
                htmlFor="register-password"
                className="text-sm font-semibold block"
                style={{color: '#1A1A1A'}}
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••"
                  className="h-12 rounded-lg border-2 border-gray-200 focus:border-yellow-400 focus:ring-0 focus:outline-none pl-4 pr-10 text-base transition-colors"
                  style={{
                    backgroundColor: '#FFFFFC',
                  }}
                  {...registerForm.register("password", { required: "Password wajib diisi" })}
                />
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
              {registerForm.formState.errors.password && (
                <p className="flex items-center gap-2 text-sm text-red-600 mt-1">
                  <AlertCircle className="h-4 w-4" />
                  {registerForm.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label
                htmlFor="register-confirm-password"
                className="text-sm font-semibold block"
                style={{color: '#1A1A1A'}}
              >
                Konfirmasi Password
              </Label>
              <div className="relative">
                <Input
                  id="register-confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••"
                  className="h-12 rounded-lg border-2 border-gray-200 focus:border-yellow-400 focus:ring-0 focus:outline-none pl-4 pr-10 text-base transition-colors"
                  style={{
                    backgroundColor: '#FFFFFC',
                  }}
                  {...registerForm.register("confirmPassword", {
                    required: "Konfirmasi password wajib diisi",
                    validate: (value) =>
                      value === registerForm.getValues("password") || "Password tidak cocok",
                  })}
                />
                {registerForm.formState.errors.confirmPassword ? (
                  <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
                ) : (
                  registerForm.getValues("confirmPassword") && (
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
              {registerForm.formState.errors.confirmPassword && (
                <p className="flex items-center gap-2 text-sm text-red-600 mt-1">
                  <AlertCircle className="h-4 w-4" />
                  {registerForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="terms"
                className="rounded h-4 w-4 border-2 border-gray-200 cursor-pointer"
                style={{accentColor: '#E8B824'}}
                {...registerForm.register("terms", {
                  required: "Anda harus menyetujui syarat & ketentuan",
                })}
              />
              <label htmlFor="terms" className="text-sm cursor-pointer" style={{color: '#4A4A4A'}}>
                Saya setuju dengan{" "}
                <a href="#" className="hover:underline font-medium" style={{color: '#E8B824'}}>Syarat & Ketentuan</a>
              </label>
            </div>
            {registerForm.formState.errors.terms && (
              <p className="flex items-center gap-2 text-sm text-red-600 mt-1">
                <AlertCircle className="h-4 w-4" />
                {registerForm.formState.errors.terms.message}
              </p>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 font-semibold text-base rounded-lg transition-all hover:opacity-90 shadow-md flex items-center justify-center gap-2"
              style={{
                backgroundColor: '#1A1A1A',
                color: '#FFFFFC'
              }}
              disabled={isLoading || !registerForm.formState.isValid}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-400 border-t-transparent"></div>
                  <span>Mendaftar...</span>
                </>
              ) : (
                "DAFTAR SEKARANG"
              )}
            </Button>

            {/* Terms Text */}
            <p className="text-xs text-center leading-relaxed" style={{color: '#999999'}}>
              Dengan mendaftar, Anda setuju dengan <a href="#" className="hover:underline" style={{color: '#E8B824'}}>Syarat & Ketentuan</a> dan <a href="#" className="hover:underline" style={{color: '#E8B824'}}>Kebijakan Privasi</a> kami.
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

          {/* Login Link - Outside Form */}
          <p className="text-center text-base" style={{color: '#4A4A4A'}}>
            Sudah punya akun? 
            <Button
              type="button"
              variant="link"
              className="ml-1 px-0 h-auto font-bold transition-colors hover:opacity-70"
              style={{color: '#E8B824'}}
              onClick={() => router.push("/auth/login")}
            >
              Login di sini
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}