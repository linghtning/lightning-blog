import { serve } from '@hono/node-server'
import { createRuntime } from './runtime'
import { createServerApp } from './app'

async function main() {
  const runtime = await createRuntime()
  const app = createServerApp(runtime)

  serve(
    {
      fetch: app.fetch,
      port: runtime.env.PORT,
    },
    (info) => {
      console.log(
        `Lightning Blog server running on http://localhost:${info.port}`,
      )
    },
  )
}

main().catch(console.error)
