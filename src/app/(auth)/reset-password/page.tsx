import { type SearchParams } from "next/dist/server/request/search-params";

import { ResetPasswordForm } from "./_components/ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  const email = typeof params.email === "string" ? params.email : "";

  if (!token || !email) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8">
        <p className="text-sm text-red-400">
          Invalid reset link. Please request a new one.
        </p>
        <a
          href="/forgot-password"
          className="mt-4 block text-sm text-white hover:underline"
        >
          Request password reset
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8">
      <h2 className="mb-6 text-xl font-semibold text-white">
        Reset your password
      </h2>
      <ResetPasswordForm token={token} email={email} />
    </div>
  );
}
