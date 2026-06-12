export function Footer() {
  return (
    <footer id="footer" className="bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row">
          <div className="max-w-xs">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 text-lg">
                🐠
              </span>
              <span className="text-lg font-extrabold text-white">
                Discus<span className="text-teal-400">Fish</span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Premium nutrition for vibrant, healthy discus. Made by keepers,
              for keepers.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 text-sm">
            <div>
              <h4 className="font-semibold text-white">Shop</h4>
              <ul className="mt-3 space-y-2 text-slate-400">
                <li>
                  <a href="#products" className="hover:text-teal-400">
                    All foods
                  </a>
                </li>
                <li>
                  <a href="#products" className="hover:text-teal-400">
                    Best sellers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white">Support</h4>
              <ul className="mt-3 space-y-2 text-slate-400">
                <li>
                  <a href="#features" className="hover:text-teal-400">
                    Why us
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:hello@discusfish.app"
                    className="hover:text-teal-400"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-sm text-slate-500">
          © {new Date().getFullYear()} DiscusFish. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
