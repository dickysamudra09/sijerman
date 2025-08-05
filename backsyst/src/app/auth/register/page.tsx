"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock, User, CheckCircle2, AlertCircle } from "lucide-react";

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
        role, // Gunakan role dari form register
      });
    if (profileError) {
      console.error("Error syncing profile:", profileError.message);
    }

    // Insert session hanya jika auth.uid() tersedia (biasanya tidak tersedia setelah signUp)
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
    // Jika email konfirmasi diaktifkan, tunggu konfirmasi
    if (signUpData.user?.confirmation_sent_at) {
      setSuccessMessage("Pendaftaran berhasil! Silakan verifikasi email Anda untuk login.");
      setTimeout(() => router.push("/auth/login"), 2000); // Redirect ke login setelah 2 detik
    } else {
      router.push("/home"); // Arahkan ke home jika tidak ada konfirmasi
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Buat Akun Baru</CardTitle>
          <CardDescription className="text-center">Daftar gratis dan mulai belajar hari ini</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
            {error && (
              <div className="text-sm text-red-600 text-center">{error}</div>
            )}
            {successMessage && (
              <div className="text-sm text-green-600 text-center">{successMessage}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="register-role">Daftar sebagai</Label>
              <select
                id="register-role"
                className="w-full border rounded px-3 py-2 text-sm"
                {...registerForm.register("role", { required: "Pilih peran Anda" })}
              >
                <option value="">Pilih</option>
                <option value="teacher">Guru</option>
                <option value="student">Siswa</option>
              </select>
              {registerForm.formState.errors.role && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {registerForm.formState.errors.role.message}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-name">Nama Lengkap</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="register-name"
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  className="pl-10"
                  {...registerForm.register("name", { required: "Nama wajib diisi" })}
                />
              </div>
              {registerForm.formState.errors.name && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {registerForm.formState.errors.name.message}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="register-email"
                  type="email"
                  placeholder="nama@example.com"
                  className="pl-10"
                  {...registerForm.register("email", { required: "Email wajib diisi" })}
                />
              </div>
              {registerForm.formState.errors.email && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {registerForm.formState.errors.email.message}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Buat password"
                  className="pl-10 pr-10"
                  {...registerForm.register("password", { required: "Password wajib diisi" })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {registerForm.formState.errors.password && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {registerForm.formState.errors.password.message}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-confirm-password">Konfirmasi Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="register-confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Konfirmasi password"
                  className="pl-10"
                  {...registerForm.register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (value) =>
                      value === registerForm.getValues("password") || "Passwords do not match",
                  })}
                />
              </div>
              {registerForm.formState.errors.confirmPassword && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {registerForm.formState.errors.confirmPassword.message}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="terms"
                className="rounded"
                {...registerForm.register("terms", {
                  required: "You must accept the terms and conditions",
                })}
              />
              <label htmlFor="terms" className="text-sm">
                Saya setuju dengan{" "}
                <Button variant="link" size="sm" type="button" className="p-0 h-auto">
                  Syarat & Ketentuan
                </Button>
              </label>
            </div>
            {registerForm.formState.errors.terms && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {registerForm.formState.errors.terms.message}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
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
          </form>
        </CardContent>
      </Card>

      <Card className="w-full max-w-md mt-4">
        <CardHeader>
          <CardTitle className="text-center text-sm">Keuntungan Bergabung</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Akses ke semua course gratis</span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Tracking progress belajar</span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Sertifikat penyelesaian</span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Komunitas belajar</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}