"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginSchema, type LoginFormValues } from "@/lib/validation/auth.validation";
import { useLogin } from "@/hooks/use-login";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  function onSubmit(values: LoginFormValues) {
    login.mutate(values, {
      onSuccess: () => {
        const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
        router.push(redirectTo);
      },
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-card bg-white p-8 shadow-sm">
        <h1 className="text-h1 text-neutral-900">Log in</h1>
        <p className="text-body mt-1 text-neutral-500">
          Welcome back to TeamSync.
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 space-y-4"
          noValidate
        >
          <div>
            <label
              htmlFor="email"
              className="text-caption block font-medium text-neutral-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              className="text-body mt-1 w-full rounded-control border border-neutral-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
            {errors.email && (
              <p id="email-error" className="text-caption mt-1 text-danger">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-caption block font-medium text-neutral-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
              className="text-body mt-1 w-full rounded-control border border-neutral-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
            {errors.password && (
              <p id="password-error" className="text-caption mt-1 text-danger">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              id="rememberMe"
              type="checkbox"
              {...register("rememberMe")}
              className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary/30"
            />
            <label
              htmlFor="rememberMe"
              className="text-caption text-neutral-700"
            >
              Remember me
            </label>
          </div>

          {login.isError && (
            <p
              role="alert"
              className="text-caption rounded-control bg-danger/10 px-3 py-2 text-danger"
            >
              {login.error.response?.data?.message ??
                "Something went wrong. Please try again."}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || login.isPending}
            className="text-body w-full rounded-control bg-primary px-4 py-2 font-medium text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {login.isPending ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="text-caption mt-6 text-center text-neutral-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:text-primary-dark"
          >
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
