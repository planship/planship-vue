import type { Ref } from 'vue'
import { inject, ref, computed } from 'vue'
import type { Entitlements } from '@planship/fetch'
import { PlanshipCustomer } from '@planship/fetch'
import { PLANSHIP_DEFAULT_BASE_URL, PLANSHIP_OPTIONS_KEY } from './planshipPlugin'
import type {
  EntitlementsBase,
  IPlanshipCustomerContext,
  TPlanshipCustomerContextPromiseMixin,
  IPlanshipPluginOptions
} from './types'

const isServer = typeof window === 'undefined'

class PlanshipCustomerData {
  planshipCustomerApiClient: PlanshipCustomer

  entitlementsDict = ref({})

  isEntitlementsFetching = ref(true)

  entitlementsCallback(newEntitlements: Entitlements) {
    this.entitlementsDict.value = newEntitlements
  }

  constructor(planshipCustomerApiClient: PlanshipCustomer, entitlementsDict?: Ref<Entitlements>) {
    if (entitlementsDict) this.entitlementsDict = entitlementsDict
    this.planshipCustomerApiClient = planshipCustomerApiClient
  }

  async fetchEntitlements() {
    try {
      this.isEntitlementsFetching.value = true
      this.entitlementsDict.value = await this.planshipCustomerApiClient.getEntitlements(
        isServer ? undefined : this.entitlementsCallback.bind(this)
      )
    } catch (e) {
      console.error('Error fetching entitlements')
      console.dir(e)
    } finally {
      this.isEntitlementsFetching.value = false
    }
  }

  customerData<T extends EntitlementsBase>(
    fallbackEntitlements: Entitlements,
    entitlementsClass?: { new (e: Entitlements): T }
  ): IPlanshipCustomerContext<T> {
    return {
      planshipCustomerApiClient: this.planshipCustomerApiClient,
      entitlements: computed(() =>
        entitlementsClass
          ? new entitlementsClass(this.entitlementsDict.value ?? fallbackEntitlements)
          : this.entitlementsDict.value
      ),
      isEntitlementsFetching: this.isEntitlementsFetching,
      fetchEntitlements: this.fetchEntitlements.bind(this)
    }
  }
}

const planshipCustomers: { [customerId: string]: PlanshipCustomerData } = {}

async function _usePlanshipCustomerAsync<T extends EntitlementsBase>(
  planshipCustomer: PlanshipCustomerData,
  fetchEntitlements: boolean,
  fallbackEntitlements: Entitlements,
  entitlementsClass?: { new (e: Entitlements): T }
): Promise<IPlanshipCustomerContext<T>> {
  if (fetchEntitlements) await planshipCustomer.fetchEntitlements()

  return planshipCustomer.customerData(fallbackEntitlements, entitlementsClass)
}

export function usePlanshipCustomer<T extends EntitlementsBase>(
  customerId: string,
  entitlementsClass?: { new (e: Entitlements): T }
): TPlanshipCustomerContextPromiseMixin<T> {
  const options = inject<IPlanshipPluginOptions>(PLANSHIP_OPTIONS_KEY)
  if (!options) throw Error('No Planship plugin options')

  let fetchEntitlements = isServer
  // if useState is provided via options (Eg. for Nuxt), initialize entitlementsDict with it
  const entitlementsDict = options.useState ? options.useState(customerId, () => ({})) : undefined

  if (!planshipCustomers[customerId]) {
    planshipCustomers[customerId] = new PlanshipCustomerData(
      new PlanshipCustomer(options.slug, customerId, options.auth, {
        baseUrl: options.baseUrl || PLANSHIP_DEFAULT_BASE_URL,
        webSocketUrl: options.webSocketUrl,
        debugLogging: options.debugLogging,
        extras: {
          fetchApi: options.fetchApi || fetch
        }
      }),
      entitlementsDict
    )
    fetchEntitlements = true
  }

  const defaultEntitlementsDict = options.defaultEntitlementsDict ?? {}

  const asyncData = planshipCustomers[customerId].customerData(defaultEntitlementsDict, entitlementsClass)

  let asyncDataPromise = _usePlanshipCustomerAsync(
    planshipCustomers[customerId],
    fetchEntitlements,
    defaultEntitlementsDict,
    entitlementsClass
  )

  // update entitlementsDict (initialized with custom useState) after entitlements are fetched
  if (entitlementsDict && isServer) {
    asyncDataPromise = asyncDataPromise.then((value) => {
      entitlementsDict.value = value.entitlements.value.entitlementsDict || value.entitlements.value
      return value
    })
  }

  return {
    ...asyncDataPromise,
    ...asyncData
  }
}
