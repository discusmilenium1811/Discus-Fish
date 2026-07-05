import sharp from 'sharp'

const [input, output] = process.argv.slice(2)

if (!input || !output) {
  console.error('Usage: node scripts/remove-chroma-key.mjs <input> <output>')
  process.exit(1)
}

const image = sharp(input).ensureAlpha()
const { data, info } = await image.raw().toBuffer({ resolveWithObject: true })

for (let i = 0; i < data.length; i += 4) {
  const r = data[i]
  const g = data[i + 1]
  const b = data[i + 2]
  const greenDominance = g - Math.max(r, b)
  const keyDistance = Math.hypot(r, 255 - g, b)

  // Preserve opaque product pixels while softly feathering antialiased edges.
  const alphaFromDistance = Math.max(0, Math.min(255, (keyDistance - 14) * 4.5))
  const alphaFromDominance = Math.max(0, Math.min(255, (150 - greenDominance) * 3))
  const alpha = Math.min(alphaFromDistance, alphaFromDominance)

  if (alpha < 255) {
    // Remove green spill from partially transparent edge pixels.
    const neutralGreen = Math.max(r, b)
    data[i + 1] = Math.round(neutralGreen + (g - neutralGreen) * (alpha / 255))
  }
  data[i + 3] = Math.round(alpha)
}

await sharp(data, { raw: info }).png({ compressionLevel: 9 }).toFile(output)
