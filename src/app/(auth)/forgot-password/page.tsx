"use client";

import { useActionState } from "react";

import { forgotPasswordAction } from "~/server/actions/auth";

const initialState = { error: undefined, success: false };

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(
    forgotPasswordAction,
    initialState,
  );

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8">
      <h2 className="mb-2 text-xl font-semibold text-white">Forgot password</h2>
      <p className="mb-6 text-sm text-zinc-400">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      {state?.success ? (
        <div className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-4 text-sm text-zinc-300">
          If that email is registered, a reset link has been sent. Check your
          inbox.
        </div>
      ) : (
        <form action={formAction} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-zinc-300"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              placeholder="you@example.com"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-red-400">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200 disabled:opacity-50"
          >
            {pending ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}

      <p className="mt-4 text-center text-sm text-zinc-400">
        <a href="/login" className="text-white hover:underline">
          Back to sign in
        </a>
      </p>
    </div>
  );
}
