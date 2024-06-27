import type { Entitlements, PlanshipCustomerApi, TokenGetter } from '@planship/fetch'
import type { FetchAPI } from '@planship/fetch/dist/openapi-gen'
import type { ComputedRef, Ref } from 'vue'

export class EntitlementsBase {
  entitlementsDict: Entitlements = {}

  constructor(entitlementsDict: Entitlements) {
    this.entitlementsDict = entitlementsDict
  }
}

interface IClientCredentials {
  clientId: string
  clientSecret: string
}

export interface IPlanshipPluginOptions {
  slug: string
  baseUrl?: string
  webSocketUrl?: string
  debugLogging?: boolean
  auth: TokenGetter | IClientCredentials
  defaultEntitlementsDict?: Entitlements
  fetchApi?: FetchAPI
  useState?: TUseState
}

export interface IPlanshipCustomerContext<TEntitlements extends EntitlementsBase> {
  entitlements: ComputedRef<TEntitlements | Entitlements>
  fetchEntitlements: () => void
  isEntitlementsFetching: Ref<boolean>
  planshipCustomerApiClient: PlanshipCustomerApi
}

export type TPlanshipCustomerContextPromiseMixin<TEntitlements extends EntitlementsBase> =
  IPlanshipCustomerContext<TEntitlements> & Promise<IPlanshipCustomerContext<TEntitlements>>

export type TUseState = <T>(key?: string | undefined, init?: (() => T | Ref<T>) | undefined) => Ref<T>
