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
    mode: "onChange",
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

    // Ambil role dari tabel users sebelum sinkronisasi
    const { data: userProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    // Sinkronisasi profil pengguna ke tabel users
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

    // Insert session record
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
    <div className="flex min-h-screen">
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
            Masuk dengan mudah <br /> nikmati beragam fitur.
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Selamat Datang! Silahkan login untuk masuk akun anda
          </p>

          <form
            onSubmit={loginForm.handleSubmit(handleLogin)}
            className="space-y-6"
          >
            {error && (
              <div className="text-sm text-red-600 text-center flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label
                htmlFor="login-email"
                className="font-semibold text-gray-700"
              >
                Email Address
              </Label>
              <div className="relative">
                <Input
                  id="login-email"
                  type="email"
                  placeholder="sijerman@gmail.com"
                  className="h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                  {...loginForm.register("email", {
                    required: "Email wajib diisi",
                  })}
                />
                {loginForm.formState.errors.email ? (
                  <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
                ) : (
                  loginForm.getValues("email") && (
                    <svg
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
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

            {/* Password */}
            <div className="space-y-2">
              <Label
                htmlFor="login-password"
                className="font-semibold text-gray-700"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••"
                  className="h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                  {...loginForm.register("password", {
                    required: "Password wajib diisi",
                  })}
                />
                {/* Toggle show/hide password */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Pesan error */}
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
                  className="rounded h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 accent-[#0047AB]"
                  {...loginForm.register("remember")}
                />
                <label htmlFor="remember" className="text-gray-600">
                  Remember me
                </label>
              </div>
              <Button
                variant="link"
                size="sm"
                type="button"
                className="text-blue-600 hover:underline px-0"
              >
                Forgot Password
              </Button>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                className="flex-1 h-12 bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors shadow"
                disabled={isLoading || !loginForm.formState.isValid}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    LOGIN...
                  </>
                ) : (
                  "LOGIN"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12 border-blue-500 text-blue-500 hover:bg-blue-50 transition-colors rounded-lg shadow"
                onClick={() => router.push("/auth/register")}
              >
                SIGNUP
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-6 text-center">
              By signing up, you agree to our company's{" "}
              <a
                href="#"
                className="text-blue-600 hover:underline font-medium"
              >
                Terms and Conditions
              </a>{" "}
              and{" "}
              <a
                href="#"
                className="text-blue-600 hover:underline font-medium"
              >
                Privacy Policy
              </a>
            </p>
          </form>
        </div>
      </div>

      {/* Right Section: Abstract Visual */}
      <div className="flex-1 bg-gradient-to-br from-[#ADD8E6] via-[#B0C4DE] to-[#E0FFFF] relative overflow-hidden hidden md:block">
        <div className="absolute inset-0 z-0 opacity-80">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-40 h-40 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
      </div>
    </div>
  );
}