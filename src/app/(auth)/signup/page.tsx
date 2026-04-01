import { SignupForm } from "./_components/SignupForm";

export default function SignupPage() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8">
      <h2 className="mb-6 text-xl font-semibold text-white">Create account</h2>
      <SignupForm />
    </div>
  );
}
