# planship-vue

Welcome to `@planship/vue`, a [Vue plugin](https://vuejs.org/guide/reusability/plugins) that enables entitlements, metering, plan packaging, and customer/subscription management in your Vue app powered by [Planship](https://planship.io). This plugin is built on top of the [@planship/fetch](https://github.com/planship/planship-js/tree/master/packages/fetch) JavaScript library and it uses the [Vue provide/inject pattern](https://vuejs.org/guide/components/provide-inject).

If you're building [Nuxt](https://nuxt.com/) applications, including apps with [universal](https://nuxt.com/docs/guide/concepts/rendering#universal-rendering) (server-side + client-side) rendering mode enabled, use the [`@planship/nuxt`]('https://github.com/planship/planship-nuxt') module instead.

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

If you're building [Nuxt](https://nuxt.com/) applications, use the [`@planship/nuxt`]('https://github.com/planship/planship-nuxt') module instead.

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

The plugin needs to be initialized with your Planship product slug and authentication credentials. Because the plugin is initialized client-side in your Vue app, **the Planship API client ID and secret must not be used**. Instead, you can retrieve the Planship access token via a secure connection to your application backend, and then pass it to the plugin via a getter function.

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

In most rendering scenarios, your app will need to fetch and evaluate Planship entitlements for a specific customer. This can be accomplished with the Planship plugin and the `usePlanshipCustomer` function, which initializes a Planship API instance for a specific customer, continously fetches their `entitlements`, and exposes them in a reactive [Vue ref object](https://vuejs.org/api/reactivity-core.html#ref).

The example below shows how customer entitlements are retrieved, and a simple boolean feature called `advanced-analytics` is used to conditionally render a `<RouterLink>` element inside a Vue component.

```vue
<script setup>
  import { usePlanshipCustomer } from '@planship/vue'

  const { entitlements } = await usePlanshipCustomer('<CURRENT_CUSTOMER_ID>')
</script>

<template>
  <RouterLink
    v-if="entitlements['advanced-analytics']"
    to="/analytics"
  >
    Analytics
  </RouterLink>
</template>
```

When `usePlanshipCustomer` is used on the client-side, entitlements are automatically updated via a WebSocket connection every time they change.

### Composite return value for both `sync` and `async` operations

The `usePlanshipCustomer` function returns a composite result that is both a promise and a data object the promise resolves to. This means that the function can be called both as a synchronous function or an asynchronous one using `await` (or `then/catch` chain).

If you want to block code execution until customer entitlements are fetched from the Planship API, call the function with `await`:

```ts
const { entitlements } = await usePlanshipCustomer('<CURRENT_CUSTOMER_ID>')
```

If you want to return immediately and fetch entitlements asynchronously, simply call usePlanshipCustomer without `await`:

```ts
const { entitlements } = usePlanshipCustomer('<CURRENT_CUSTOMER_ID>')
```

Since `entitlements` is a reactive Vue ref object, you can use it in your component and page templates and let Vue automatically rerender once the entitlements are fetched.

### Fetching additional data from Planship

Your app may need to fetch additional customer data from Planship (E.g. customer subscription or usage data). To accomplish any Planship API operation use an instance of the [Planship Customer API client](https://github.com/planship/planship-js/blob/master/packages/fetch/docs/interfaces/PlanshipCustomerApi.md) returned by the `usePlanshipCustomer` function.

Below is an example Vue setup script that retrieves a list of subscriptions for the current customer.

```vue
<script setup>
  import { usePlanshipCustomer } from '@planship/vue'

  const { planshipCustomerApiClient } = await usePlanshipCustomer('<CURRENT_CUSTOMER_ID>')
  const subscriptions = planshipCustomerApiClient.listSubscriptions()
</script>
```

### Strongly typed entitlement object

When working with the entitlements dictionary returned by `usePlanshipCustomer`, it can be useful to wrap it in an object with getters for individual levers. This is especially advantageous in IDEs like VS Code where it enables autocomplete for `entitlements`.

To accomplish this, define an entitlements class for your product and pass it to `usePlanshipCustomer`.

```vue
<script setup>
  import { usePlanshipCustomer, EntitlementsBase } from '@planship/vue'

  class MyEntitlements extends EntitlementsBase {
    get apiCallsPerMonth(): number {
      return this.entitlementsDict?.['api-calls-per-month'].valueOf()
    }

    get advancedAnalytics(): boolean {
      return this.entitlementsDict?.['advanced-analytics']
    }
  }

  // entitlements is of Ref<MyEntitlements> type
  const { entitlements } = await usePlanshipCustomer('<CURRENT_CUSTOMER_ID>', MyEntitlements)
</script>
returned by usePlanshipCustomer
<template>
  <RouterLink
    v-if="entitlements.advancedAnalytics"
    to="/analytics"
  >
    Analytics
  </RouterLink>
</template>
```

## Working with plans and other product data - `usePlanship`

If the current customer context is unknown, the `usePlanship` function can retrieve a [Planship API client](https://github.com/planship/planship-js/blob/master/packages/fetch/docs/interfaces/PlanshipApi.md). It exposes the same functionality as the Planship customer API client provided by `usePlanshipCustomer`, but all customer operations (E.g. fetching entitlements and subscriptions) require a Planship customer ID as an argument.

Below is an example Vue setup script that retrieves a list of Planship plans.

```vue
<script setup>
  import { usePlanship } from '@planship/vue'

  const { planshipApiClient } = usePlanship()
  const plans = await planshipApiClient.listPlans()
</script>
```

## Links

- [Planship Nuxt demo app](https://github.com/planship/planship-nuxt-demo)
- [@planship/fetch library at the NPM Registry](https://www.npmjs.com/package/@planship/fetch)
- [Planship documentation](https://docs.planship.io)
- [Planship console](https://app.planship.io)
