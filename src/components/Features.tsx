const FEATURES = [
  {
    icon: '🎨',
    title: 'Color enhancing',
    text: 'Natural astaxanthin and carotenoids bring out deep reds and blues.',
  },
  {
    icon: '🧬',
    title: 'Vet-formulated',
    text: 'Balanced protein and nutrients tuned to the discus diet.',
  },
  {
    icon: '💧',
    title: 'Clean water',
    text: 'Low-waste recipes that won’t cloud your tank or spike ammonia.',
  },
  {
    icon: '🚚',
    title: 'Fast shipping',
    text: 'Free delivery on orders over $35, shipped within 24 hours.',
  },
]

export function Features() {
  return (
    <section id="features" className="relative overflow-hidden">
      {/* Discus photo background with a strong dark overlay */}
      <div
        className="absolute inset-0 bg-fixed bg-cover bg-center"
        style={{ backgroundImage: "url('/pictures/hero-wide.jpg')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-slate-950/88" />

      <div className="relative mx-auto max-w-6xl px-5 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Made for happy, healthy discus
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">
            Everything we make is designed around what discus actually need.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-md transition hover:border-cyan-400/40 hover:bg-white/10"
            >
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-2xl ring-1 ring-white/10">
                {f.icon}
              </div>
              <h3 className="mt-4 font-bold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                {f.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
