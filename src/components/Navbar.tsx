interface NavbarProps {
  cartCount: number
  onCartClick: () => void
}

export function Navbar({ cartCount, onCartClick }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/20 bg-white/70 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <a href="#top" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 text-lg shadow-sm">
            🐠
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            Discus<span className="text-teal-600">Fish</span>
          </span>
        </a>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 sm:flex">
          <a href="#products" className="transition hover:text-teal-600">
            Shop
          </a>
          <a href="#features" className="transition hover:text-teal-600">
            Why us
          </a>
          <a href="#footer" className="transition hover:text-teal-600">
            Contact
          </a>
        </nav>

        <button
          type="button"
          onClick={onCartClick}
          className="relative inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          <span aria-hidden="true">🛒</span>
          <span className="hidden sm:inline">Cart</span>
          {cartCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-teal-500 px-1 text-xs font-bold text-white">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
