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
import Image from "next/image";

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
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : "Login failed.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white text-slate-900 font-sans">
      {/* --- TOP/RIGHT COLUMN: Image Background --- */}
      {/* Mobile: order-first puts it on top, h-[12.5vh] makes it 1/8th height. Desktop: order-last puts it on right, h-auto fills height. */}
      <div className="order-first md:order-last h-[12.5vh] md:h-auto md:w-[62.5%] relative bg-slate-100 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
          alt="Login background design"
          fill
          priority
          className="object-cover"
        />
        {/* Optional overlay to make the image feel a bit more integrated */}
        <div className="absolute inset-0 bg-blue-900/10 mix-blend-multiply"></div>
      </div>

      {/* --- BOTTOM/LEFT COLUMN: Form Area --- */}
      {/* Desktop: 3/8ths width (37.5%). Padding increases on larger screens to keep form bounded. */}
      <div className="flex-1 md:w-[37.5%] flex flex-col justify-center px-8 py-12 md:px-12 lg:px-20 xl:px-24">
        <div className="w-full max-w-md mx-auto md:mx-0">
          {/* Header (Left Aligned) */}
          <div className="mb-10 text-left">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Sign In
            </h1>
            <p className="text-slate-500 mt-2 text-sm">
              Enter your credentials to continue to the platform.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                {...register("email")}
                type="email"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                placeholder="admin@itr-platform.com"
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
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white p-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300 flex justify-center items-center transition-colors mt-2"
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Sign In
            </button>
          </form>

          {/* Footer Links (Left Aligned to match) */}
          <p className="mt-8 text-sm text-slate-600 text-left">
            New client?{" "}
            <Link
              href="/register"
              className="text-blue-600 font-medium hover:text-blue-700 hover:underline transition-colors"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
