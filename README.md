# planship-vue

Welcome to the [Planship](https://planship.io) Vue Plugin. This plugin is built on top of the [@planship/fetch](https://github.com/planship/planship-js/tree/master/packages/fetch) JavaScript library, and it uses the [Vue provide/inject mechanism](https://vuejs.org/guide/components/provide-inject) to make consuming Planship data and functionality in Vue and [Nuxt](https://nuxt.com/) applications easier.

A complete working example of a Nuxt app that uses this plugin can be found at https://github.com/planship/planship-nuxt-demo

## How does it work?

The plugin, once initialized, exposes the Planship API client and customer entitlements to all pages and components of the application.

#### `usePlanshipCustomer`

Returns an instance of the [Planship Customer API client](https://github.com/planship/planship-js/blob/master/packages/fetch/docs/interfaces/PlanshipCustomerApi.md) and customer entitlements.

```js
import { usePlanshipCustomer } from '@planship/vue'

const { planshipCustomerApiClient, entitlements } = await usePlanshipCustomer('<CUSTOMER_ID>')
```

#### `usePlanship`
Returns an intance of the [Planship API client](https://github.com/planship/planship-js/blob/master/packages/fetch/docs/interfaces/PlanshipApi.md).

```js
import { usePlanship } from '@planship/vue'

const { planshipApiClient } = usePlanship()
```


## Getting started

To use the plugin in [Nuxt](https://nuxt.com/) applications, including [universal](https://nuxt.com/docs/guide/concepts/rendering#universal-rendering) (server-side + client-side) rendering apps, use the [`@planship/nuxt`]('https://github.com/planship/planship-nuxt') module instead.

To use in Vue SPA applications, follow the directions below.

### Installation

Install `@planship/vue` with npm, yarn or pnpm:

```sh
npm install @planship/vue
# or
yarn add @planship/vue
# or
pnpm add @planship/vue
```

### Plugin initialization

Plugin needs to be initialized with the Planship product slug and authentication credentials. Since in Vue apps the plugin is initialized on the client side, Planship API client id and secret must not be used. Instead, retrieve a Planship access token via a secure connection to you application backend, and pass it to the plugin via a getter function.

```js
import { createApp } from 'vue'
import App from './App.vue'
import { PlanshipPlugin } from '@planship/vue'

const app = createApp(App)
app.use(PlanshipPlugin,
  {
    slug: 'clicker-demo', // your Planship product slug
    auth: getAccessToken, // function that returns a valid Planship token
  }
)
app.mount('#app')
```

## Working with entitlements and other customer data - `usePlanshipCustomer`

In most rendering scenarios, your app will need to fetch and evaluate Planship entitlements for a specific customer. This can be accomplished with the Planship plugin and the `usePlanshipCustomer` function that initializes a Planship API instance for a specific customer, and automatically fetches their entitlements. The returned `entitlements` object is a reactive [Vue ref object](https://vuejs.org/api/reactivity-core.html#ref).

Here is an example that shows how customer entitlements are retrieved, and a simple boolean feature called `advanced-analytics` is used to conditionally render a `<NuxtLink>` element inside a Vue component.

```vue
<script setup>
import { usePlanshipCustomer } from '@planship/vue'

const { entitlements } = await usePlanshipCustomer('<CURRENT_USTOMER_ID>')

</script>

<template>
  <NuxtLink
    v-if="entitlements['advanced-analytics']"
    to="/analytics"
  >
    Analytics
  </NuxtLink>
</template>
```

When `usePlanshipCustomer` is used on the client-side, entitlements are automatically updated via a WebSocket connection every time they change.


### Composite return value for both `sync` and `async` operations

The `usePlanshipCustomer` function returns a composite result that is both a promise and a data object the promise resolves to. This means that the function can called both as a synchronous function, as a well as an asynchronous one using `await` (or `then/catch` chain).

If you want to block code execution until customer entitlements are fetched from the Planship API, call the function with the `await`:

```ts
const { entitlements } = await usePlanshipCustomer('<CURRENT_USTOMER_ID>')
```

If you want to return immediately, and let entitlements be fetched asynchronously, call `usePlanshipCustomer` as a synchronous function:

```ts
const { entitlements } = usePlanshipCustomer('<CURRENT_USTOMER_ID>')
```

Since `entitlements` is a reactive Vue ref object, you can use it in your component and page templates, and let Vue trigger an automatica rerender once the entitlements are fetched.

### Fetching additional data from Planship

Your app might need to fetch additional customer data from Planship, for instance subscription or usage data. To accomplish any Planship API operation use an instance of the [Planship Customer API client](https://github.com/planship/planship-js/blob/master/packages/fetch/docs/interfaces/PlanshipCustomerApi.md) returned by the `usePlanshipCustomer` function.

Below is an example Vue setup script that retrieves a list of subscriptions for the current customer using Nuxt's `useAsyncData`.

```vue
<script setup>
import { usePlanshipCustomer } from '@planship/vue'

const { planshipCustomerApiClient } = await usePlanshipCustomer('<CURRENT_USTOMER_ID>')

const { data: subscriptions } = await useAsyncData('subscriptions', async () => {
  return await planshipCustomerApiClient.listSubscriptions()
})

</script>
```

### Strongly typed entitlement object

When working with entitlements dictionary returned by `usePlanshipCustomer`, it can be useful to have it wrapped in an object with getters for individual levers. This can be especially advantageos in IDEs like VS Code where it unlocks a full autocomplete experience for entitlements.

To accomplish this, define entitlements class for your product, and pass it to `usePlanshipCustomer`.

```vue
<script setup>
import { usePlanshipCustomer, EntitlementsBase } from '@planship/vue'

class Entitlements extends EntitlementsBase {
  get apiCallsPerMonth(): number {
    return this.entitlementsDict?.['api-calls-per-month'].valueOf()
  }

  get advancedAnalytics(): boolean {
    return this.entitlementsDict?.['advanced-analytics']
  }
}

const { entitlements } = await usePlanshipCustomer('<CURRENT_USTOMER_ID>', EntitlementsBase)
// entitlements ref wraps an instance of the Entitlements class defined above

</script>

<template>
  <NuxtLink
    v-if="entitlements.advancedAnalytics"
    to="/analytics"
  >
    Analytics
  </NuxtLink>
</template>
```

## Working with plans and other product data - `usePlanship`

If the current customer context isn't known, `usePlanship` function can be used to retrieve a [Planship API client](https://github.com/planship/planship-js/blob/master/packages/fetch/docs/interfaces/PlanshipApi.md). It exposes the same functionality as the Planship customer API client provided by `usePlanshipCustomer`, but all customer operations (e.g. fetching entitlements or subscriptions), require a Planship customer ID as an argument.

Below is an example Vue setup script that retrieves a list of Planship plansusing Nuxt's `useAsyncData`.

```vue
<script setup>
import { usePlanship } from '@planship/vue'

const { planshipApiClient } = usePlanship('<CURRENT_USTOMER_ID>')

const { data: plans } = await useAsyncData('plans', async () => {
  return await planshipApiClient.listPlans()
})

</script>
```

## Links

- [Planship Nuxt demo app](https://github.com/planship/planship-nuxt-demo)
- [@planship/fetch library at the NPM Registry](https://www.npmjs.com/package/@planship/fetch)
- [Planship documentation](https://docs.planship.io)
- [Planship console](https://app.planship.io)
