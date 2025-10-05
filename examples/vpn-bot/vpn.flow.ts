import {
	getVpnPlansQuery,
	getVpnPlanQuery,
	selectVpnPlanCommand,
	processVpnOrderCommand,
} from "./logic/vpn";
import { SelectPlanComponent } from "./components/SelectPlanComponent";
import { ConfirmPlanComponent } from "./components/ConfirmPlanComponent";
import { CompleteComponent } from "./components/CompleteComponent";
import { createFlow } from "../../src";
import { noopCommand } from "../../src/core/common";

export const vpnOrderFlow = createFlow("vpnOrder", {
	/**
	 * State: selectPlan
	 */
	selectPlan: {
		onEnter: getVpnPlansQuery,
		component: SelectPlanComponent,
		onAction: {
			"select_plan::planId": {
				command: selectVpnPlanCommand,
				nextState: "confirmPlan",
			},
		},
	},

	/**
	 * State: confirmPlan
	 */
	confirmPlan: {
		// The onEnter query now reads the planId from the session internally.
		onEnter: getVpnPlanQuery,
		component: ConfirmPlanComponent,
		onAction: {
			confirm_payment: {
				// The command now reads the planId from the session internally.
				command: processVpnOrderCommand,
				nextState: "complete",
			},
			go_back: {
				command: noopCommand,
				nextState: "selectPlan",
			},
		},
	},

	/**
	 * State: complete
	 */
	complete: {
		component: CompleteComponent,
		onAction: {
			start_over: {
				command: noopCommand,
				nextState: "selectPlan",
			},
		},
	},
});
