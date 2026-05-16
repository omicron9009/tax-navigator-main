"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { api } from "@/lib/api";

// 1. Updated Schema to include confirm_password and matching validation
const schema = z
  .object({
    full_name: z.string().min(2, "Name is required"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"], // Attaches the error to the confirm_password field
  });

type FormValues = z.infer<typeof schema>;

// Helper to calculate password strength (0-4 scale)
const calculateStrength = (password: string) => {
  let score = 0;
  if (!password) return score;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
};

// Helper for gauge colors based on strength score
const getStrengthStyles = (score: number, index: number) => {
  if (score <= index) return "bg-slate-200"; // Inactive
  if (score === 1) return "bg-red-500";
  if (score === 2) return "bg-amber-500";
  if (score === 3) return "bg-blue-500";
  return "bg-emerald-600";
};

const getStrengthLabel = (score: number) => {
  if (score === 0) return "";
  if (score === 1) return "Weak";
  if (score === 2) return "Fair";
  if (score === 3) return "Good";
  return "Strong";
};

export default function RegisterPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const passwordValue = useWatch({
    control,
    name: "password",
    defaultValue: "",
  });

  const strengthScore = calculateStrength(passwordValue);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const apiPayload = {
        full_name: values.full_name,
        email: values.email,
        password: values.password,
      };

      await api("/clients/register", {
        method: "POST",
        body: apiPayload,
        auth: false,
      });

      toast.success("Account created! Please sign in.");
      router.push("/login");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white text-slate-900 font-sans">
      {/* --- TOP/RIGHT COLUMN: Image Background --- */}
      <div className="order-first md:order-last h-[12.5vh] md:h-auto md:w-[62.5%] relative bg-slate-100 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
          alt="Registration background design"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-blue-900/10 mix-blend-multiply"></div>
      </div>

      {/* --- BOTTOM/LEFT COLUMN: Form Area --- */}
      <div className="flex-1 md:w-[37.5%] flex flex-col justify-center px-8 py-12 md:px-12 lg:px-20 xl:px-24">
        <div className="w-full max-w-md mx-auto md:mx-0">
          {/* Header */}
          <div className="mb-10 text-left">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Create Account
            </h1>
            <p className="text-slate-500 mt-2 text-sm">
              Join the ITR Navigator platform to get started.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                {...register("full_name")}
                type="text"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                placeholder="John Doe"
              />
              {errors.full_name && (
                <p className="text-red-500 text-xs mt-1.5 font-medium">
                  {errors.full_name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                {...register("email")}
                type="email"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1.5 font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <input
                {...register("password")}
                type="password"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1.5 font-medium">
                  {errors.password.message}
                </p>
              )}

              {/* Password Strength Gauge (Enterprise Sharp Edges) */}
              {passwordValue.length > 0 && (
                <div className="mt-3">
                  <div className="flex gap-1 h-1.5 w-full">
                    {[0, 1, 2, 3].map((index) => (
                      <div
                        key={index}
                        className={`flex-1 transition-colors duration-300 rounded-none ${getStrengthStyles(
                          strengthScore,
                          index,
                        )}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-medium text-slate-500 mt-1.5 text-right uppercase tracking-wider">
                    {getStrengthLabel(strengthScore)}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Confirm Password
              </label>
              <input
                {...register("confirm_password")}
                type="password"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                placeholder="••••••••"
              />
              {errors.confirm_password && (
                <p className="text-red-500 text-xs mt-1.5 font-medium">
                  {errors.confirm_password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white p-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300 flex justify-center items-center transition-colors mt-4"
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Register
            </button>
          </form>

          {/* Footer Links */}
          <p className="mt-8 text-sm text-slate-600 text-left">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-blue-600 font-medium hover:text-blue-700 hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
