export interface ComfortableRange { min: number; max: number }

export function getComfortableRange(samples: number[]): ComfortableRange {
  if (!samples.length) return { min: 55, max: 74 }
  const sorted = [...samples].sort((a, b) => a - b)
  const lowIndex = Math.floor((sorted.length - 1) * .1)
  const highIndex = Math.ceil((sorted.length - 1) * .9)
  const min = Math.round(sorted[lowIndex])
  const max = Math.round(sorted[highIndex])
  return max - min < 5 ? { min: Math.min(min, 55), max: Math.max(max, 74) } : { min, max }
}
