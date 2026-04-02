"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock, User, CheckCircle2, AlertCircle } from "lucide-react";

interface AuthDialogProps {
  children: React.ReactNode;
}

interface LoginForm {
  email: string;
  password: string;
  remember?: boolean;
}

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "teacher" | "student";
  terms: boolean;
}

export function AuthDialog({ children }: AuthDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // React Hook Form for login
  const loginForm = useForm<LoginForm>({
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  // React Hook Form for register
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

  const handleLogin = async () => {
    setIsLoading(true);
    setError("");

    const { email, password } = loginForm.getValues();
    console.log("Login attempt with:", { email, password });

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    console.log("SignIn response:", { error: signInError });

    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
      return;
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    console.log("User data:", { userData, error: userError });

    if (userError || !userData.user) {
      setError("Gagal mendapatkan data user.");
      setIsLoading(false);
      return;
    }

    const userId = userData.user.id;

    // Ambil role dari tabel users sebelum sinkronisasi
    const { data: userProfile, error: fetchError } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    // Sinkronisasi profil pengguna ke tabel users dengan role dari database
    const { error: profileError } = await supabase
      .from("users")
      .upsert(
        {
          id: userId,
          name: userData.user.user_metadata?.full_name || "",
          email: userData.user.email || "",
          role: userProfile?.role || "student", // Gunakan role dari database, fallback ke student
        },
        { onConflict: "id" }
      );
    if (profileError) {
      console.error("Error syncing profile:", profileError.message);
    }

    // Insert session record hanya jika auth.uid() tersedia
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
      console.warn("Authentication UID not available or mismatched, skipping session insert.");
    }

    setIsLoading(false);
    setIsOpen(false);
    router.push("/home");
  };

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
      setSuccessMessage("Pendaftaran berhasil! Silakan cek email Anda untuk konfirmasi.");
    } else {
      setIsOpen(false);
      router.push("/home"); // Arahkan ke home jika tidak ada konfirmasi
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Selamat Datang di EduPlatform</DialogTitle>
          <DialogDescription>Masuk atau daftar untuk mulai belajar</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Masuk</TabsTrigger>
            <TabsTrigger value="register">Daftar</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Masuk ke Akun</CardTitle>
                <CardDescription className="text-center">Masukkan email dan password Anda</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  {error && (
                    <div className="text-sm text-red-600 text-center">{error}</div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="nama@example.com"
                        className="pl-10"
                        {...loginForm.register("email", { required: "Email wajib diisi" })}
                      />
                    </div>
                    {loginForm.formState.errors.email && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        {loginForm.formState.errors.email.message}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Masukkan password"
                        className="pl-10 pr-10"
                        {...loginForm.register("password", { required: "Password wajib diisi" })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        {loginForm.formState.errors.password.message}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="remember"
                        className="rounded"
                        {...loginForm.register("remember")}
                      />
                      <label htmlFor="remember" className="text-sm">Ingat saya</label>
                    </div>
                    <Button variant="link" size="sm" type="button">
                      Lupa password?
                    </Button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || !loginForm.formState.isValid}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Masuk...
                      </>
                    ) : (
                      "Masuk"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <Card>
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

            <Card>
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}