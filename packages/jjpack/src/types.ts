import type JJpack from './jjpack'

export type Plugin = (jjpack: JJpack) => void

export interface Package {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}
