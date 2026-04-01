import { type SearchParams } from "next/dist/server/request/search-params";

import { LoginForm } from "./_components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const verified = params.verified === "true";
  const error = typeof params.error === "string" ? params.error : undefined;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8">
      <h2 className="mb-6 text-xl font-semibold text-white">Sign in</h2>

      {verified && (
        <div className="mb-4 rounded-lg border border-green-800 bg-green-950 px-4 py-3 text-sm text-green-300">
          Email verified! You can now sign in.
        </div>
      )}

      {error === "expired-link" && (
        <div className="mb-4 rounded-lg border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-300">
          Verification link has expired. Please{" "}
          <a href="/signup" className="underline">
            sign up again
          </a>{" "}
          or request a new link.
        </div>
      )}

      {error === "invalid-link" && (
        <div className="mb-4 rounded-lg border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-300">
          Invalid verification link. Please try signing in or contact support.
        </div>
      )}

      <LoginForm />
    </div>
  );
}
