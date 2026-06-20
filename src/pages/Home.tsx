import { useOutletContext } from 'react-router-dom'
import { Hero } from '../components/Hero'
import { ProductGrid } from '../components/ProductGrid'
import { CtaBanner } from '../components/CtaBanner'
import { Features } from '../components/Features'
import type { StorefrontContext } from '../layouts/StorefrontLayout'

export function Home() {
  const { products, addToCart } = useOutletContext<StorefrontContext>()
  return (
    <>
      <Hero />
      <ProductGrid products={products} onAdd={addToCart} />
      <CtaBanner />
      <Features />
    </>
  )
}
