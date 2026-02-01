export const THEMES = {
  pink: {
    name: 'Pink',
    primary: '#ec4899',
    light: '#fbcfe8',
    gradient: 'linear-gradient(to right, #fecdd3, #fbcfe8)',
    bgColor: '#fce7f3',
  },
  red: {
    name: 'Red',
    primary: '#ef4444',
    light: '#fecaca',
    gradient: 'linear-gradient(to right, #fecaca, #fca5a5)',
    bgColor: '#fee2e2',
  },
  purple: {
    name: 'Purple',
    primary: '#a855f7',
    light: '#e9d5ff',
    gradient: 'linear-gradient(to right, #ddd6fe, #e9d5ff)',
    bgColor: '#f3e8ff',
  },
  sunset: {
    name: 'Sunset',
    primary: '#f97316',
    light: '#fed7aa',
    gradient: 'linear-gradient(to right, #fed7aa, #fbcfe8)',
    bgColor: '#ffedd5',
  },
} as const

export type ThemeKey = keyof typeof THEMES

export const FONTS = [
  { name: 'Loveheart', file: 'Loveheart-Regular.ttf', displayName: 'Loveheart' },
  { name: 'Dancing Script', file: 'DancingScript-Regular.ttf', displayName: 'Dancing Script' },
  { name: 'Great Vibes', file: 'GreatVibes-Regular.ttf', displayName: 'Great Vibes' },
  { name: 'Pacifico', file: 'Pacifico-Regular.ttf', displayName: 'Pacifico' },
  { name: 'Sacramento', file: 'Sacramento-Regular.ttf', displayName: 'Sacramento' },
  { name: 'Caveat', file: 'Caveat-Regular.ttf', displayName: 'Caveat' },
  { name: 'Cookie', file: 'Cookie-Regular.ttf', displayName: 'Cookie' },
  { name: 'Satisfy', file: 'Satisfy-Regular.ttf', displayName: 'Satisfy' },
] as const

export const PHOTO_STYLES = ['polaroid', 'hearts'] as const
export type PhotoStyle = (typeof PHOTO_STYLES)[number]

export const MAX_PHOTOS = 10
export const MAX_MESSAGE_LENGTH = 500
export const MAX_NAME_LENGTH = 50

export const SECTION_TYPES = ['photos', 'message', 'spotify'] as const
export type SectionType = (typeof SECTION_TYPES)[number]
export const DEFAULT_SECTION_ORDER: SectionType[] = ['photos', 'message', 'spotify']
