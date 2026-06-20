import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { ProductGrid } from './components/ProductGrid'
import { Features } from './components/Features'
import { CtaBanner } from './components/CtaBanner'
import { Footer } from './components/Footer'
import { CartDrawer } from './components/CartDrawer'
import { LanguageDrawer } from './components/LanguageDrawer'
import { AuthModal } from './components/AuthModal'
import { useCart } from './hooks/useCart'
import { fetchProducts } from './lib/api'
import { sampleProducts } from './data/sampleProducts'
import type { Product } from './types'

function App() {
  const cart = useCart()
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>(sampleProducts)
  const [cartOpen, setCartOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  // Load the live catalog; fall back to sample data if the API isn't up yet.
  useEffect(() => {
    fetchProducts()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setProducts(data)
      })
      .catch(() => {
        /* keep sample data */
      })
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar
        cartCount={cart.count}
        onCartClick={() => setCartOpen(true)}
        onLanguageClick={() => setLanguageOpen(true)}
        onAuthClick={(mode) => {
          setAuthMode(mode)
          setAuthOpen(true)
        }}
        onAdminClick={() => navigate('/admin')}
      />
      <main>
        <Hero />
        <ProductGrid products={products} onAdd={cart.add} />
        <CtaBanner />
        <Features />
      </main>
      <Footer />
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart.items}
        totalCents={cart.totalCents}
        onSetQuantity={cart.setQuantity}
        onRemove={cart.remove}
        onClear={cart.clear}
      />
      <LanguageDrawer
        open={languageOpen}
        onClose={() => setLanguageOpen(false)}
      />
      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onModeChange={setAuthMode}
      />
    </div>
  )
}

export default App
