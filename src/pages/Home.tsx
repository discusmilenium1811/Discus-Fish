import { useOutletContext } from 'react-router-dom'
import { Hero } from '../components/Hero'
import { HomeProductShowcase } from '../components/HomeProductShowcase'
import { CtaBanner } from '../components/CtaBanner'
import { Features } from '../components/Features'
import type { StorefrontContext } from '../layouts/StorefrontLayout'

export function Home() {
  const { products } = useOutletContext<StorefrontContext>()
  return (
    <>
      <Hero />
      <HomeProductShowcase products={products} />
      <CtaBanner />
      <Features />
    </>
  )
}
