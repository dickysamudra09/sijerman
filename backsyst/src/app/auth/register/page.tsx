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

    // Sinkronisasi profil pengguna ke tabel users saat register
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
    <div className="flex min-h-screen flex-row-reverse">
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <img
                src="/img/1.png" 
                alt="Logo" 
                className="h-12 w-auto mr-2"
              />
              <span className="text-xl font-bold text-gray-800">Si Jerman</span>
            </div>
            <Button onClick={() => router.push("/")} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          </div>

          <h1 className="text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
            Buat akun baru dan mulai belajar sekarang.
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Selamat Datang! Silahkan daftar untuk membuat akun anda
          </p>

          <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-6">
            {error && (
              <div className="text-sm text-red-600 text-center flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}
            {successMessage && (
              <div className="text-sm text-green-600 text-center flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4" /> {successMessage}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="register-role" className="font-semibold text-gray-700">Daftar sebagai</Label>
              <select
                id="register-role"
                className="w-full border rounded-lg px-3 py-2 text-base h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                {...registerForm.register("role", { required: "Pilih peran Anda" })}
              >
                <option value="">Pilih</option>
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

            <div className="space-y-2">
              <Label htmlFor="register-name" className="font-semibold text-gray-700">Nama Lengkap</Label>
              <div className="relative">
                <Input
                  id="register-name"
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  className="h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                  {...registerForm.register("name", { required: "Nama wajib diisi" })}
                />
                {registerForm.formState.errors.name && (
                  <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
                )}
              </div>
              {registerForm.formState.errors.name && (
                <p className="flex items-center gap-2 text-sm text-red-600 mt-1">
                  <AlertCircle className="h-4 w-4" />
                  {registerForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-email" className="font-semibold text-gray-700">Email Address</Label>
              <div className="relative">
                <Input
                  id="register-email"
                  type="email"
                  placeholder="nama@example.com"
                  className="h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                  {...registerForm.register("email", { required: "Email wajib diisi" })}
                />
                {registerForm.formState.errors.email && (
                  <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
                )}
              </div>
              {registerForm.formState.errors.email && (
                <p className="flex items-center gap-2 text-sm text-red-600 mt-1">
                  <AlertCircle className="h-4 w-4" />
                  {registerForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-password">Password</Label>
              <div className="relative">
                <Input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Buat password"
                  className="h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                  {...registerForm.register("password", { required: "Password wajib diisi" })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {registerForm.formState.errors.password && (
                <p className="flex items-center gap-2 text-sm text-red-600 mt-1">
                  <AlertCircle className="h-4 w-4" />
                  {registerForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-confirm-password">Konfirmasi Password</Label>
              <div className="relative">
                <Input
                  id="register-confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Konfirmasi password"
                  className="h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                  {...registerForm.register("confirmPassword", {
                    required: "Konfirmasi password wajib diisi",
                    validate: (value) =>
                      value === registerForm.getValues("password") || "Passwords tidak cocok",
                  })}
                />
                {registerForm.formState.errors.confirmPassword && (
                  <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
                )}
              </div>
              {registerForm.formState.errors.confirmPassword && (
                <p className="flex items-center gap-2 text-sm text-red-600 mt-1">
                  <AlertCircle className="h-4 w-4" />
                  {registerForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="terms"
                className="rounded h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 accent-[#0047AB]"
                {...registerForm.register("terms", {
                  required: "Anda harus menyetujui syarat & ketentuan",
                })}
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                Saya setuju dengan{" "}
                <a href="#" className="text-blue-600 hover:underline font-medium">Syarat & Ketentuan</a>
              </label>
            </div>
            {registerForm.formState.errors.terms && (
              <p className="flex items-center gap-2 text-sm text-red-600 mt-1">
                <AlertCircle className="h-4 w-4" />
                {registerForm.formState.errors.terms.message}
              </p>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                className="flex-1 h-12 bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors shadow"
                disabled={isLoading || !registerForm.formState.isValid}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Mendaftar...
                  </>
                ) : (
                  "Daftar Sekarang"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12 border-blue-500 text-blue-500 hover:bg-blue-50 transition-colors rounded-lg shadow"
                onClick={() => router.push('/auth/login')}
              >
                LOGIN
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Left Section: Abstract Visual */}
      <div className="flex-1 bg-gradient-to-br from-[#ADD8E6] via-[#B0C4DE] to-[#E0FFFF] relative overflow-hidden hidden md:block">
        {/* Placeholder for the abstract shapes/bubbles */}
        <div className="absolute inset-0 z-0 opacity-80">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-40 h-40 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
      </div>
    </div>
  );
}