# evnex-sdk

A TypeScript library for interacting with the [Evnex](https://www.evnex.com) EV charger API. Supports authentication, charge point management, session history, load management, and more.

> This project is not affiliated with Evnex. Based upon [python-evnex](https://github.com/hardbyte/python-evnex).

## Installation

```bash
npm install evnex-sdk
# or
bun add evnex-sdk
```

## Quick Start

```typescript
import { Evnex } from "evnex-sdk";

const evnex = new Evnex("your@email.com", "yourpassword");

await evnex.authenticate();

// Fetch user details and set the default org
const user = await evnex.getUserDetail();
console.log(user.organisations);
```

## Authentication

The `Evnex` constructor accepts your Evnex account credentials. Call `authenticate()` once to retrieve tokens. Tokens are refreshed automatically on expiry.

```typescript
const evnex = new Evnex("your@email.com", "yourpassword");
await evnex.authenticate();
```

If you already have tokens from a previous session, you can pass them in to skip the initial login:

```typescript
import type { EvnexTokens } from "evnex-sdk";

const tokens: EvnexTokens = {
  idToken: "...",
  accessToken: "...",
  refreshToken: "...",
};

const evnex = new Evnex("your@email.com", "yourpassword", tokens);
```

## API Reference

### User

```typescript
// Get user details (also sets the default org ID)
const user = await evnex.getUserDetail();
```

### Organisation

```typescript
// List all charge points in an org
const chargePoints = await evnex.getOrgChargePoints(orgId);

// Get a summary of org charger statuses
const summary = await evnex.getOrgSummaryStatus(orgId);

// Get daily energy insights for the past N days
const insights = await evnex.getOrgInsight(7, orgId);
```

### Charge Points

```typescript
// Get full charge point details (v3)
const detail = await evnex.getChargePointDetailV3(chargePointId);
console.log(detail.data.attributes.networkStatus); // "ONLINE" | "OFFLINE"

// Get current connector status
const status = await evnex.getChargePointStatus(chargePointId);

// Get session history
const sessions = await evnex.getChargePointSessions(chargePointId);

// Get solar config
const solar = await evnex.getChargePointSolarConfig(chargePointId);

// Get override config
const override = await evnex.getChargePointOverride(chargePointId);
```

### Commands

```typescript
// Stop an active charging session
await evnex.stopChargePoint(chargePointId);

// Enable or disable a charger connector
await evnex.enableCharger(orgId, chargePointId);
await evnex.disableCharger(orgId, chargePointId);

// Set charge now override on/off
await evnex.setChargePointOverride(chargePointId, true);

// Unlock a connector
await evnex.unlockCharger(chargePointId);
```

### Load Management

```typescript
// Apply a load management profile (limits current by time of day)
await evnex.setChargerLoadProfile(chargePointId, [
  { start: 0, limit: 6 },      // 12am: 6A
  { start: 25200, limit: 16 }, // 7am: 16A
]);

// Apply a charge schedule
await evnex.setChargePointSchedule(chargePointId, [
  { start: 0, limit: 0 },      // off overnight
  { start: 25200, limit: 16 }, // on from 7am
]);
```

## Configuration

You can override default API and Cognito settings via the optional `config` parameter:

```typescript
const evnex = new Evnex("email", "password", undefined, {
  baseUrl: "https://client-api.evnex.io", // default
  cognitoRegion: "ap-southeast-2",        // default
  cognitoUserPoolId: "...",
  cognitoClientId: "...",
  orgId: "your-default-org-id",           // skips getUserDetail() for org resolution
});
```

## Error Handling

```typescript
import { NotAuthorizedException } from "evnex-sdk";

try {
  await evnex.authenticate();
} catch (err) {
  if (err instanceof NotAuthorizedException) {
    console.error("Invalid credentials");
  }
}
```

## Examples

A few example scripts are provided in the `examples/` folder.

## License

MIT