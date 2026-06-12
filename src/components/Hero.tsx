export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-teal-900 to-cyan-800 text-white"
    >
      {/* Soft glowing orbs */}
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-cyan-400/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-teal-400/20 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-2 md:py-28">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-200">
            Vet-formulated nutrition
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Vibrant color.
            <br />
            <span className="bg-gradient-to-r from-cyan-300 to-teal-200 bg-clip-text text-transparent">
              Healthier discus.
            </span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-slate-200">
            Premium foods crafted for the unique needs of discus fish — for
            richer colors, stronger growth, and happier tanks.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#products"
              className="rounded-full bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-900 shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-300"
            >
              Shop the collection
            </a>
            <a
              href="#features"
              className="rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Why DiscusFish
            </a>
          </div>
          <div className="mt-8 flex items-center gap-6 text-sm text-slate-300">
            <span>⭐ 4.9/5 from 2,000+ keepers</span>
            <span>🚚 Free shipping over $35</span>
          </div>
        </div>

        {/* Floating product highlight card */}
        <div className="relative hidden md:block">
          <div className="animate-float mx-auto w-64 rounded-3xl bg-white/10 p-6 backdrop-blur-md ring-1 ring-white/20">
            <div className="grid h-40 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 text-7xl shadow-inner">
              🐠
            </div>
            <p className="mt-4 text-sm font-semibold text-white">
              Premium Discus Granules
            </p>
            <p className="text-xs text-slate-300">
              Color-enhancing · high protein
            </p>
            <p className="mt-2 text-lg font-bold text-cyan-200">$14.99</p>
          </div>
        </div>
      </div>
    </section>
  )
}
