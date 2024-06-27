import { inject } from 'vue'
import { PLANSHIP_KEY } from './planshipPlugin'
import type { Planship } from '@planship/fetch'

export const usePlanship = () => {
  const planshipApiClient = inject<Planship>(PLANSHIP_KEY)
  return { planshipApiClient }
}
