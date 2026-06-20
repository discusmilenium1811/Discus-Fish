import { useOutletContext } from 'react-router-dom'
import { HomeProductShowcase } from '../components/HomeProductShowcase'
import { CtaBanner } from '../components/CtaBanner'
import type { StorefrontContext } from '../layouts/StorefrontLayout'

export function Home() {
  const { products } = useOutletContext<StorefrontContext>()
  return (
    <>
      <HomeProductShowcase products={products} />
      <CtaBanner />
    </>
  )
}
