import type { Locale } from './config'
import type { Dictionary } from './dictionaries/types'
import { en } from './dictionaries/en'
import { es } from './dictionaries/es'

const dictionaries: Record<Locale, Dictionary> = { en, es }

export const getDictionary = (locale: Locale): Dictionary => dictionaries[locale]
export type { Dictionary }
