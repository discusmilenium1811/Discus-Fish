import { useOutletContext } from 'react-router-dom'
import { ProductSearch } from '../components/ProductSearch'
import { HomeCategories } from '../components/HomeCategories'
import { HomeStory } from '../components/HomeStory'
import { CtaBanner } from '../components/CtaBanner'
import type { StorefrontContext } from '../layouts/StorefrontLayout'

export function Home() {
  const { products } = useOutletContext<StorefrontContext>()
  return (
    <>
      <ProductSearch products={products} />
      <HomeCategories />
      <HomeStory />
      <CtaBanner />
    </>
  )
}
