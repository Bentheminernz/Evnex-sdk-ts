import { Evnex } from "../src/api";
import type { EvnexChargePoint } from "../src/schema/charge_points";

async function main() {
  const evnex = new Evnex("*username*", "*password*");

  await evnex.authenticate();
  const userData = await evnex.getUserDetail();

  console.log("User data:", userData);

  for (const org of userData.organisations) {
    console.log(`Org: ${org.name} (${org.id})`);

    const dailyInsights = await evnex.getOrgInsight(7, org.id);
    for (const segment in dailyInsights) {
        console.log(segment)
    }

    const chargePoints: EvnexChargePoint[] = [];
    try {
        const chargePoints = await evnex.getOrgChargePoints(org.id);
    } catch (err) {
        const chargePoints = await evnex.getOrgChargePoints(org.slug);
    }

    for (const chargePoint of chargePoints) {
        try {
            console.log(`Charge info: ${chargePoint}`);

            const charge_status = await evnex.getChargePointStatus(chargePoint.id);
            console.log(`Charge status: ${charge_status}`);

            console.log(`Getting detail for charge point ${chargePoint.id}...`);
            const charge_detail = await evnex.getChargePointDetailV3(chargePoint.id);
            console.log(`Charge detail: ${charge_detail}`);

            if (charge_detail.data.attributes.networkStatus == "OFFLINE") {
                console.warn(`Charge point ${chargePoint.id} is offline!`);
            } else {
                console.log(`Charge point ${chargePoint.id} is online.`);
                break
            }

            console.log(`Getting override schedule for charge point ${chargePoint.id}...`);
            const override_schedule = await evnex.getChargePointOverride(chargePoint.id);
            console.log(`Override schedule: ${override_schedule}`);

            console.log(`Getting sessions for charge point ${chargePoint.id}...`);
            const sessions = await evnex.getChargePointSessions(chargePoint.id);
            console.log(`Sessions: ${sessions}`);

            if (sessions.length > 0 && sessions[0]!.attributes.endDate == null) {
                console.warn(`Charge point ${chargePoint.id} has an active session!`);
            } else {
                console.log(`Charge point ${chargePoint.id} has no active sessions.`);
            }
        } catch (err) {
            console.error(`Failed to get detail for charge point ${chargePoint.id}:`, err);
        }
    }
  }
};

main().catch((err) => {
  console.error("Error in main:", err);
});