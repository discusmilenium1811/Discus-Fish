export function CtaBanner() {
  return (
    <section className="relative overflow-hidden">
      {/* Parallax photo background (discus row on black) */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url('/pictures/discus-row.webp')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-slate-950/70" />

      <div className="relative mx-auto max-w-3xl px-5 py-24 text-center text-white sm:py-28">
        <h2 className="text-3xl font-extrabold tracking-tight drop-shadow sm:text-4xl">
          Nutrition that brings out their best
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-slate-200">
          From fry to full-grown showpieces, our foods are built to deepen
          color and fuel healthy growth — naturally.
        </p>
        <a
          href="#products"
          className="mt-8 inline-block rounded-full bg-cyan-400 px-7 py-3 text-sm font-bold text-slate-900 shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-300"
        >
          Shop now
        </a>
      </div>
    </section>
  )
}
