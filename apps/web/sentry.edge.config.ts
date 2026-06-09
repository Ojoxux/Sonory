import * as Sentry from "@sentry/nextjs"

import { getSentryOptions, isSentryEnabled } from "./sentry.shared.config"

if (isSentryEnabled()) {
   Sentry.init(getSentryOptions())
}
