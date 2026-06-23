import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { adminNav } from './adminNav'
import { GlobalSearch } from './components/GlobalSearch'

export function AdminLayout() {
  const { user, profile, loading, isAdmin, signOut } = useAuth()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950/55 text-slate-300">
        Loading…
      </div>
    )
  }

  // Gate: only the admin may enter.
  if (!user || !isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950/55 px-6 text-center text-slate-200">
        <div className="max-w-sm">
          <div className="mb-3 text-4xl">🔒</div>
          <h1 className="mb-2 text-xl font-bold text-white">Admins only</h1>
          <p className="mb-5 text-sm text-slate-400">
            You need to be signed in as an administrator to view this page.
          </p>
          <Link
            to="/"
            className="inline-flex rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-cyan-300"
          >
            ← Back to store
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-950/45 text-slate-100">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-slate-900/60 lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-4">
          <Link to="/" aria-label="Go to main page">
            <img
              src="/pictures/Logo/viber_image_2026-06-20_16-16-33-937.jpg"
              alt="DiscusFish"
              className="h-24 w-auto rounded-xl object-contain"
            />
          </Link>
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Admin Panel
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-3">
          {adminNav.map((group) => (
            <div key={group.title}>
              <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {group.title}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/admin'}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? 'bg-cyan-400/15 text-cyan-200'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="px-2 pb-2 text-xs text-slate-400">
            {profile?.username ?? user.email}
          </div>
          <div className="flex gap-2">
            <Link
              to="/"
              className="flex-1 rounded-lg border border-white/15 px-3 py-2 text-center text-xs font-semibold text-slate-200 hover:bg-white/5"
            >
              View store
            </Link>
            <button
              type="button"
              onClick={() => signOut()}
              className="flex-1 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-rose-400/40 hover:text-white"
            >
              Log out
            </button>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-x-hidden">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 lg:hidden">
          <span className="font-extrabold text-white">
            Discus<span className="text-cyan-400">Fish</span> Admin
          </span>
          <Link to="/" className="text-sm text-cyan-300">
            Store →
          </Link>
        </div>

        {/* Search header */}
        <div className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 px-5 py-3 backdrop-blur lg:px-8">
          <GlobalSearch />
        </div>

        <div className="mx-auto max-w-6xl px-5 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
