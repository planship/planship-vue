import { Planship } from '@planship/fetch'
import type { IPlanshipPluginOptions } from './types.js'
import type { App } from 'vue'

export const PLANSHIP_DEFAULT_BASE_URL = 'https://api.planship.io'
export const PLANSHIP_KEY = 'planship'
export const PLANSHIP_OPTIONS_KEY = 'planshipOption'

export const PlanshipPlugin = {
  install: (app: App, options: IPlanshipPluginOptions) => {
    const apiClient = new Planship(options.slug, options.auth, {
      baseUrl: options.baseUrl || PLANSHIP_DEFAULT_BASE_URL,
      debugLogging: options.debugLogging,
      extras: {
        fetchApi: options.fetchApi || fetch
      }
    })

    app.provide(PLANSHIP_KEY, apiClient)
    app.provide(PLANSHIP_OPTIONS_KEY, options)
  }
}
