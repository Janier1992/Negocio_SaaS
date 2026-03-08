import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="container flex items-center justify-between h-20 border-b border-border/40">
        <div className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          NegociosSaaS
        </div>
        <nav className="flex gap-4">
          <Link href="/login" className="btn btn-ghost">
            Log in
          </Link>
          <Link href="/login" className="btn btn-primary">
            Get Started
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="container flex flex-col items-center text-center gap-8 py-20">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary backdrop-blur-3xl">
            Beta v1.0
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text text-transparent max-w-4xl">
            Control total para tu negocio, <br />
            <span className="text-primary">simplificado.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Gestión de inventario, ventas, clientes y facturación en una sola plataforma.
            Diseñada para escalar contigo desde el primer día.
          </p>

          <div className="flex gap-4 mt-8">
            <Link href="/login" className="btn btn-primary text-lg px-8 py-4">
              Comenzar Gratis
            </Link>
            <Link href="#features" className="btn btn-ghost text-lg px-8 py-4 border border-input">
              Ver Demo
            </Link>
          </div>

          <div className="mt-20 w-full max-w-5xl aspect-video glass rounded-xl overflow-hidden shadow-2xl border border-white/10 relative">
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              [App Screenshot Placeholder]
            </div>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border/40">
        &copy; 2026 NegociosSaaS. All rights reserved.
      </footer>
    </div>
  );
}
