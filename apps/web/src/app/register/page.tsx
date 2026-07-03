"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/lib/validation/auth.validation";
import { useRegister } from "@/hooks/use-register";

export default function RegisterPage() {
  const router = useRouter();
  const registerUser = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  function onSubmit(values: RegisterFormValues) {
    registerUser.mutate(values, {
      onSuccess: () => router.push("/dashboard"),
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-card bg-white p-8 shadow-sm">
        <h1 className="text-h1 text-neutral-900">Create your account</h1>
        <p className="text-body mt-1 text-neutral-500">
          Start tracking projects with your team.
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 space-y-4"
          noValidate
        >
          <div>
            <label
              htmlFor="name"
              className="text-caption block font-medium text-neutral-700"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              {...register("name")}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
              className="text-body mt-1 w-full rounded-control border border-neutral-300 px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
            {errors.name && (
              <p id="name-error" className="text-caption mt-1 text-danger">
                {errors.name.message}
              </p>
            )}
          </div>

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
              autoComplete="new-password"
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
            <p className="text-caption mt-1 text-neutral-500">
              At least 8 characters.
            </p>
          </div>

          {registerUser.isError && (
            <p
              role="alert"
              className="text-caption rounded-control bg-danger/10 px-3 py-2 text-danger"
            >
              {registerUser.error.response?.data?.message ??
                "Something went wrong. Please try again."}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || registerUser.isPending}
            className="text-body w-full rounded-control bg-primary px-4 py-2 font-medium text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {registerUser.isPending ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-caption mt-6 text-center text-neutral-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:text-primary-dark"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
