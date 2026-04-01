export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Spellbook
          </h1>
          <p className="mt-1 text-sm text-zinc-400">Yu-Gi-Oh! Simulator</p>
        </div>
        {children}
      </div>
    </div>
  );
}
