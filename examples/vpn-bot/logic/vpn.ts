import { createQuery, createCommand } from "../../../src";
import { z } from "zod";

// --- 1. Mock Database ---

const VPN_PLANS = [
	{ id: "1m", name: "1 Month", price: 9.99 },
	{ id: "6m", name: "6 Months", price: 49.99 },
	{ id: "1y", name: "1 Year", price: 89.99 },
];

// --- 2. Zod Schemas for our data ---

const VpnPlanSchema = z.object({
	id: z.string(),
	name: z.string(),
	price: z.number(),
});

const VpnConfigSchema = z.object({
	fileName: z.string(),
	fileContent: z.string(),
});

// --- 3. Business Logic: Queries ---

/**
 * Fetches the list of all available VPN plans.
 */
export const getVpnPlansQuery = createQuery({
	input: z.void(),
	output: z.array(VpnPlanSchema),
	execute: async () => {
		return VPN_PLANS;
	},
	name: "getVpnPlans",
});

/**
 * Fetches a single VPN plan by its ID from the session.
 */
export const getVpnPlanQuery = createQuery({
	input: z.void(), // Input is now void, as we get the ID from the session.
	output: VpnPlanSchema,
	name: "getVpnPlan",
	execute: async (_, ctx) => {
		const planId = ctx.session.planId;
		if (!planId) {
			throw new Error("planId not found in session");
		}
		const plan = VPN_PLANS.find((p) => p.id === planId);
		if (!plan) {
			throw new Error(`Plan with id ${planId} not found`);
		}
		return plan;
	},
});

// --- 4. Business Logic: Commands ---

/**
 * Stores the selected plan ID in the session.
 */
export const selectVpnPlanCommand = createCommand({
	input: z.object({ planId: z.string() }),
	output: z.object({}),
	name: "selectVpnPlan",
	execute: async ({ planId }, ctx) => {
		ctx.session.planId = planId;
		return {};
	},
});

/**
 * Simulates processing the payment and generating the .ovpn file.
 */
export const processVpnOrderCommand = createCommand({
	input: z.void(), // Input is now void, as we get the ID from the session.
	output: VpnConfigSchema,
	name: "processVpnOrder",
	execute: async (_, ctx) => {
		const planId = ctx.session.planId;
		if (!planId) {
			throw new Error("planId not found in session");
		}

		const plan = VPN_PLANS.find((p) => p.id === planId);
		if (!plan) {
			throw new Error(`Plan with id ${planId} not found`);
		}

		console.log(`Simulating payment for plan: ${plan.name} (${plan.price})`);

		const timestamp = new Date().toISOString();
		const fileContent = `
# VPN Configuration for ${plan.name}
# Generated at ${timestamp}
client
dev tun
proto udp
... (rest of the config)
    `;

		return {
			fileName: `kaizin-vpn-${plan.id}-${Date.now()}.ovpn`,
			fileContent,
		};
	},
});
