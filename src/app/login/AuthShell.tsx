import type { ReactNode } from "react";

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="relative z-10 flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-6xl animate-float" aria-hidden>🎁</div>
          <h1 className="mt-2 font-display text-5xl font-bold text-berry">{title}</h1>
          <p className="mt-1 text-muted">{subtitle}</p>
        </div>
        <div className="card overflow-hidden">
          <div className="candy-stripe h-2" />
          <div className="p-6">{children}</div>
        </div>
      </div>
    </main>
  );
}
