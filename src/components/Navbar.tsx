interface NavbarProps {
  cartCount: number
  onCartClick: () => void
}

export function Navbar({ cartCount, onCartClick }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/60 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <a href="#top" className="flex items-center gap-2.5">
          <img
            src="/pictures/logo.jpg"
            alt="DiscusFish logo"
            className="h-9 w-9 rounded-xl object-cover shadow-sm ring-1 ring-slate-200"
          />
          <span className="text-lg font-extrabold tracking-tight text-white">
            Discus<span className="text-cyan-400">Fish</span>
          </span>
        </a>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-300 sm:flex">
          <a href="#products" className="transition hover:text-cyan-300">
            Shop
          </a>
          <a href="#features" className="transition hover:text-cyan-300">
            Why us
          </a>
          <a href="#footer" className="transition hover:text-cyan-300">
            Contact
          </a>
        </nav>

        <button
          type="button"
          onClick={onCartClick}
          className="relative inline-flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300"
        >
          <span aria-hidden="true">🛒</span>
          <span className="hidden sm:inline">Cart</span>
          {cartCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
