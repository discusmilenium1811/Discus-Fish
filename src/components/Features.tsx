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
    <section id="features" className="bg-white">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Made for happy, healthy discus
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-500">
            Everything we make is designed around what discus actually need.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-100 bg-slate-50/60 p-6 text-center transition hover:border-teal-200 hover:bg-teal-50/50"
            >
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-2xl shadow-sm">
                {f.icon}
              </div>
              <h3 className="mt-4 font-bold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {f.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
