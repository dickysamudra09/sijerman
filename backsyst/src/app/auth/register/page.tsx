"use client";

import { useState, useRef, useEffect, Fragment } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, ArrowLeft, ChevronDown } from "lucide-react";

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
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Animation hook
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    // Redirect immediately to login with smooth transition animation
    router.push("/auth/login?registered=true");
  };

  return (
    <>
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
      <div className="flex-1 flex flex-col overflow-y-auto p-6 md:p-8 lg:p-12 relative" style={{background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,253,248,1) 100%)'}}>
        {/* Decorative Blobs */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-yellow-400 to-amber-300 rounded-full filter blur-3xl opacity-8 pointer-events-none" style={{opacity: 0.08}}></div>
        <div className="absolute bottom-32 left-20 w-80 h-80 bg-gradient-to-br from-amber-300 to-yellow-300 rounded-full filter blur-3xl opacity-6 pointer-events-none" style={{opacity: 0.06}}></div>

        <div className="w-full max-w-md mx-auto flex flex-col min-h-full justify-center relative z-10">
          {/* Glassmorphic Card Container */}
          <div className="rounded-2xl p-8 md:p-10" style={{
            background: 'rgba(255, 255, 252, 0.7)',
            border: '1px solid rgba(232, 184, 36, 0.15)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(232, 184, 36, 0.08)',
            animation: isVisible ? 'fadeScaleIn 0.7s ease-out 0.2s forwards' : 'none',
            opacity: isVisible ? 1 : 0
          }}>
            {/* Header */}
            <div className="mb-8" style={{animation: isVisible ? 'fadeSlideDown 0.6s ease-out forwards' : 'none', opacity: isVisible ? 1 : 0}}>
              <div className="flex items-center gap-2 mb-2">
                <img src="/img/1.png" alt="Logo" className="h-10 w-auto" />
                <div>
                  <div className="text-lg font-bold" style={{color: '#E8B824'}}>Si Jerman</div>
                  <p className="text-xs uppercase tracking-wider" style={{color: '#999999', letterSpacing: '0.05em'}}>Learning Platform</p>
                </div>
              </div>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-3" style={{color: '#1A1A1A', lineHeight: '1.3', animation: isVisible ? 'fadeSlideDown 0.6s ease-out 0.1s forwards' : 'none', opacity: isVisible ? 1 : 0}}>
                Buat Akun Baru
              </h1>
              <p className="text-base leading-relaxed" style={{color: '#4A4A4A', lineHeight: '1.6', animation: isVisible ? 'fadeSlideDown 0.6s ease-out 0.2s forwards' : 'none', opacity: isVisible ? 1 : 0}}>
                Mulai perjalanan belajar Bahasa Jerman Anda hari ini.
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
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  className="w-full h-12 rounded-lg border-2 px-4 flex items-center justify-between transition-all duration-300 hover:shadow-md"
                  style={{
                    borderColor: '#E8B824',
                    backgroundColor: '#FFFFFC',
                    color: '#1A1A1A'
                  }}
                  id="register-role"
                >
                  <span style={{color: registerForm.getValues("role") ? '#1A1A1A' : '#999999'}}>
                    {registerForm.getValues("role") === "teacher" ? "Guru" : registerForm.getValues("role") === "student" ? "Siswa" : "Pilih peran Anda"}
                  </span>
                  <ChevronDown
                    className="h-5 w-5 transition-transform duration-300"
                    style={{
                      color: '#E8B824',
                      transform: isRoleDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                  />
                </button>

                {/* Dropdown Menu */}
                {isRoleDropdownOpen && (
                  <div
                    className="absolute top-full left-0 right-0 mt-2 rounded-lg border-2 shadow-lg z-50 animate-in fade-in duration-200"
                    style={{
                      borderColor: '#E8B824',
                      backgroundColor: '#FFFFFC',
                      animation: 'fadeIn 0.2s ease-out forwards'
                    }}
                  >
                    {/* Option: Student */}
                    <button
                      type="button"
                      onClick={() => {
                        registerForm.setValue("role", "student", { shouldValidate: true });
                        setIsRoleDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left transition-all duration-200 flex items-center justify-between group hover:bg-opacity-5"
                      style={{
                        backgroundColor: registerForm.getValues("role") === "student" ? 'rgba(232, 184, 36, 0.08)' : 'transparent',
                        color: '#1A1A1A',
                        borderBottom: '1px solid rgba(232, 184, 36, 0.1)'
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">Siswa</span>
                        <span className="text-xs" style={{color: '#999999'}}>Pelajar bahasa Jerman</span>
                      </div>
                      {registerForm.getValues("role") === "student" && (
                        <div className="h-5 w-5 rounded-full flex items-center justify-center" style={{backgroundColor: '#E8B824'}}>
                          <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>

                    {/* Option: Teacher */}
                    <button
                      type="button"
                      onClick={() => {
                        registerForm.setValue("role", "teacher", { shouldValidate: true });
                        setIsRoleDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left transition-all duration-200 flex items-center justify-between group"
                      style={{
                        backgroundColor: registerForm.getValues("role") === "teacher" ? 'rgba(232, 184, 36, 0.08)' : 'transparent',
                        color: '#1A1A1A'
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">Guru</span>
                        <span className="text-xs" style={{color: '#999999'}}>Mengajar bahasa Jerman</span>
                      </div>
                      {registerForm.getValues("role") === "teacher" && (
                        <div className="h-5 w-5 rounded-full flex items-center justify-center" style={{backgroundColor: '#E8B824'}}>
                          <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  </div>
                )}
              </div>
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
                  className="h-12 rounded-lg border-2 transition-all duration-300 px-4 text-base"
                  style={{
                    borderColor: '#E8B824',
                    backgroundColor: '#FFFFFC'
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
                  className="h-12 rounded-lg border-2 transition-all duration-300 px-4 text-base"
                  style={{
                    borderColor: '#E8B824',
                    backgroundColor: '#FFFFFC'
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
                  className="h-12 rounded-lg border-2 transition-all duration-300 px-4 text-base"
                  style={{
                    borderColor: '#E8B824',
                    backgroundColor: '#FFFFFC'
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
                  className="h-12 rounded-lg border-2 transition-all duration-300 px-4 text-base"
                  style={{
                    borderColor: '#E8B824',
                    backgroundColor: '#FFFFFC'
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
                className="rounded h-4 w-4 border-2 border-gray-200 cursor-pointer transition-all duration-300"
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
              <span className="px-3 bg-gradient-to-b from-white to-[#FFFDF8]" style={{color: '#999999'}}>atau</span>
            </div>
          </div>

          {/* Login Link - Outside Form */}
          <p className="text-center text-base" style={{color: '#4A4A4A'}}>
            Sudah punya akun? 
            <Button
              type="button"
              variant="link"
              className="ml-1 px-0 h-auto font-bold transition-all duration-300 hover:opacity-70"
              style={{color: '#E8B824'}}
              onClick={() => router.push("/auth/login")}
            >
              Login di sini
            </Button>
          </p>
          </div>

        </div>
      </div>
    </div>

    </>
  );
}