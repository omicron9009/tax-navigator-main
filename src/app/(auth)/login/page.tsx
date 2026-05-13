"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Keeping your core logic imports
import { useAuth, rolePath } from "@/lib/auth";
import { ApiError } from "@/lib/api";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (user) router.push(rolePath(user.role));
  }, [user, router]);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const u = await login(values.email, values.password);
      toast.success("Welcome back");
      router.push(rolePath(u.role));
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : "Login failed.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-900 p-4">
      <div className="max-w-md w-full bg-white p-8 border rounded-xl shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Sign In</h1>
          <p className="">Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              {...register("email")}
              type="email"
              className="w-full p-2 border rounded-md outline-blue-600"
              placeholder="admin@itr-platform.com"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              {...register("password")}
              type="password"
              className="w-full p-2 border rounded-md outline-blue-600"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white p-2 rounded-md font-medium hover:bg-blue-700 disabled:bg-blue-300 flex justify-center items-center"
          >
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Sign In
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          New client?{" "}
          <Link href="/register" className="text-blue-600 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
