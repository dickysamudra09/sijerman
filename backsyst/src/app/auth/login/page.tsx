"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";

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
    // Redirect berdasarkan role
    const role = userProfile?.role || "student";
    router.push(`/home/${role}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
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
    </div>
  );
}