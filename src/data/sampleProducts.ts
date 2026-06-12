import type { Product } from '../types'

/**
 * Fallback catalog used when the back-end API isn't reachable yet, so the
 * storefront always looks complete. Once the server returns products, these
 * are replaced automatically.
 */
export const sampleProducts: Product[] = [
  {
    id: 'premium-discus-granules',
    slug: 'premium-discus-granules',
    name: 'Premium Discus Granules',
    description:
      'High-protein sinking granules for vibrant color and healthy daily growth.',
    priceCents: 1499,
    currency: 'usd',
    weightGrams: 100,
    stock: 50,
    isActive: true,
  },
  {
    id: 'color-boost-flakes',
    slug: 'color-boost-flakes',
    name: 'Color-Boost Flakes',
    description:
      'Astaxanthin-rich flakes that intensify reds, blues and oranges.',
    priceCents: 999,
    currency: 'usd',
    weightGrams: 80,
    stock: 64,
    isActive: true,
  },
  {
    id: 'beefheart-flakes',
    slug: 'beefheart-flakes',
    name: 'Beefheart Flakes',
    description:
      'A protein-packed classic conditioning food for breeding discus.',
    priceCents: 1249,
    currency: 'usd',
    weightGrams: 90,
    stock: 40,
    isActive: true,
  },
  {
    id: 'freeze-dried-bloodworms',
    slug: 'freeze-dried-bloodworms',
    name: 'Freeze-Dried Bloodworms',
    description: 'Irresistible natural treat, gently freeze-dried to lock in nutrients.',
    priceCents: 1699,
    currency: 'usd',
    weightGrams: 50,
    stock: 30,
    isActive: true,
  },
  {
    id: 'spirulina-discus-pellets',
    slug: 'spirulina-discus-pellets',
    name: 'Spirulina Discus Pellets',
    description:
      'Plant-rich pellets that support digestion and a strong immune system.',
    priceCents: 1199,
    currency: 'usd',
    weightGrams: 120,
    stock: 55,
    isActive: true,
  },
  {
    id: 'fry-juvenile-powder',
    slug: 'fry-juvenile-powder',
    name: 'Fry & Juvenile Powder',
    description:
      'Fine micro-powder formulated for fast, even growth in young discus.',
    priceCents: 849,
    currency: 'usd',
    weightGrams: 60,
    stock: 70,
    isActive: true,
  },
]
