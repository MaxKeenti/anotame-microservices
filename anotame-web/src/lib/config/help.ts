import * as m from '$lib/paraglide/messages';

type Text = () => string;

export type HelpCategory = 'daily' | 'catalog' | 'admin' | 'preferences';
export type CalloutKind = 'important' | 'tip' | 'admin';

export type HelpCallout = {
	kind: CalloutKind;
	text: Text;
};

export type HelpTopic = {
	id: string;
	category: HelpCategory;
	title: Text;
	summary: Text;
	keywords?: Text;
	adminOnly?: boolean;
	employeeSummary?: Text;
	employeeBullets?: Text[];
	appHref?: string;
	steps?: Text[];
	callouts?: HelpCallout[];
	related?: string[];
};

export type HelpQuickStart = {
	id: string;
	topicId: string;
	title: Text;
	summary: Text;
	appHref?: string;
	adminOnly?: boolean;
	employeeOnly?: boolean;
};

export type HelpTerm = {
	id: string;
	term: Text;
	description: Text;
};

export type HelpTroubleItem = {
	id: string;
	title: Text;
	resolution: Text;
};

export const helpCategories: Array<{ id: HelpCategory; label: Text }> = [
	{ id: 'daily', label: m['help.category.daily'] },
	{ id: 'catalog', label: m['help.category.catalog'] },
	{ id: 'admin', label: m['help.category.admin'] },
	{ id: 'preferences', label: m['help.category.preferences'] },
];

export const helpQuickStarts: HelpQuickStart[] = [
	{
		id: 'new-order',
		topicId: 'create-order',
		title: m['help.quick.orderTitle'],
		summary: m['help.quick.orderSummary'],
		appHref: '/dashboard/orders/new',
	},
	{
		id: 'operations-flow',
		topicId: 'order-lifecycle',
		title: m['help.quick.opsTitle'],
		summary: m['help.quick.opsSummary'],
		appHref: '/dashboard/operations',
	},
	{
		id: 'delivery',
		topicId: 'delivery-pickup',
		title: m['help.quick.deliveryTitle'],
		summary: m['help.quick.deliverySummary'],
		appHref: '/dashboard/operations',
	},
	{
		id: 'payments',
		topicId: 'payments-refunds',
		title: m['help.quick.paymentTitle'],
		summary: m['help.quick.paymentSummary'],
		appHref: '/dashboard/orders',
	},
	{
		id: 'admin-setup',
		topicId: 'admin-setup',
		title: m['help.quick.adminTitle'],
		summary: m['help.quick.adminSummary'],
		appHref: '/dashboard/admin/settings',
		adminOnly: true,
	},
	{
		id: 'ask-admin',
		topicId: 'admin-managed',
		title: m['help.quick.askAdminTitle'],
		summary: m['help.quick.askAdminSummary'],
		employeeOnly: true,
	},
];

export const helpTopics: HelpTopic[] = [
	{
		id: 'navigation',
		category: 'daily',
		title: m['help.nav.title'],
		summary: m['help.nav.summary'],
		keywords: m['help.nav.keywords'],
		steps: [
			m['help.nav.stepDashboard'],
			m['help.nav.stepDock'],
			m['help.nav.stepMenu'],
			m['help.nav.stepMobile'],
		],
		callouts: [
			{ kind: 'tip', text: m['help.nav.tip'] },
		],
		related: ['roles-access', 'preferences'],
	},
	{
		id: 'roles-access',
		category: 'daily',
		title: m['help.roles.title'],
		summary: m['help.roles.summary'],
		keywords: m['help.roles.keywords'],
		steps: [
			m['help.roles.employee'],
			m['help.roles.admin'],
			m['help.roles.hidden'],
		],
		callouts: [
			{ kind: 'admin', text: m['help.roles.adminNote'] },
		],
		related: ['admin-managed', 'users-credentials'],
	},
	{
		id: 'key-terms',
		category: 'daily',
		title: m['help.terms.title'],
		summary: m['help.terms.summary'],
		keywords: m['help.terms.keywords'],
		related: ['create-order', 'delivery-pickup'],
	},
	{
		id: 'order-lifecycle',
		category: 'daily',
		title: m['help.lifecycle.title'],
		summary: m['help.lifecycle.summary'],
		keywords: m['help.lifecycle.keywords'],
		steps: [
			m['help.lifecycle.received'],
			m['help.lifecycle.inProgress'],
			m['help.lifecycle.ready'],
			m['help.lifecycle.delivered'],
			m['help.lifecycle.cancelled'],
		],
		callouts: [
			{ kind: 'important', text: m['help.lifecycle.important'] },
		],
		related: ['create-order', 'delivery-pickup', 'payments-refunds'],
	},
	{
		id: 'create-order',
		category: 'daily',
		title: m['help.order.title'],
		summary: m['help.order.summary'],
		keywords: m['help.order.keywords'],
		appHref: '/dashboard/orders/new',
		steps: [
			m['help.order.stepCustomer'],
			m['help.order.stepPriceList'],
			m['help.order.stepGarments'],
			m['help.order.stepServices'],
			m['help.order.stepPayment'],
			m['help.order.stepPrint'],
		],
		callouts: [
			{ kind: 'important', text: m['help.order.ticketImportant'] },
			{ kind: 'tip', text: m['help.order.customerTip'] },
		],
		related: ['drafts', 'catalog-dependencies', 'capacity-scheduling'],
	},
	{
		id: 'drafts',
		category: 'daily',
		title: m['help.drafts.title'],
		summary: m['help.drafts.summary'],
		keywords: m['help.drafts.keywords'],
		appHref: '/dashboard/orders',
		steps: [
			m['help.drafts.stepSaved'],
			m['help.drafts.stepResume'],
			m['help.drafts.stepDelete'],
		],
		callouts: [
			{ kind: 'important', text: m['help.drafts.localWarning'] },
		],
		related: ['create-order'],
	},
	{
		id: 'order-detail-editing',
		category: 'daily',
		title: m['help.editing.title'],
		summary: m['help.editing.summary'],
		keywords: m['help.editing.keywords'],
		appHref: '/dashboard/orders',
		steps: [
			m['help.editing.stepDetail'],
			m['help.editing.stepEmployee'],
			m['help.editing.stepAdmin'],
			m['help.editing.stepHistory'],
		],
		callouts: [
			{ kind: 'important', text: m['help.editing.locked'] },
		],
		related: ['order-lifecycle', 'payments-refunds'],
	},
	{
		id: 'payments-refunds',
		category: 'daily',
		title: m['help.payments.title'],
		summary: m['help.payments.summary'],
		keywords: m['help.payments.keywords'],
		appHref: '/dashboard/orders',
		steps: [
			m['help.payments.stepOpen'],
			m['help.payments.stepRecord'],
			m['help.payments.stepRefund'],
			m['help.payments.stepHistory'],
		],
		callouts: [
			{ kind: 'important', text: m['help.payments.important'] },
		],
		related: ['delivery-pickup', 'order-detail-editing'],
	},
	{
		id: 'delivery-pickup',
		category: 'daily',
		title: m['help.delivery.title'],
		summary: m['help.delivery.summary'],
		keywords: m['help.delivery.keywords'],
		appHref: '/dashboard/operations',
		steps: [
			m['help.delivery.stepReady'],
			m['help.delivery.stepCode'],
			m['help.delivery.stepBalance'],
			m['help.delivery.stepConfirm'],
		],
		callouts: [
			{ kind: 'important', text: m['help.delivery.codeImportant'] },
		],
		related: ['payments-refunds', 'order-lifecycle'],
	},
	{
		id: 'customers',
		category: 'daily',
		title: m['help.customers.title'],
		summary: m['help.customers.summary'],
		keywords: m['help.customers.keywords'],
		appHref: '/dashboard/customers',
		steps: [
			m['help.customers.stepSearch'],
			m['help.customers.stepCreate'],
			m['help.customers.stepEdit'],
			m['help.customers.stepDelete'],
		],
		callouts: [
			{ kind: 'important', text: m['help.customers.deleteWarning'] },
		],
		related: ['create-order'],
	},
	{
		id: 'catalog-dependencies',
		category: 'catalog',
		title: m['help.catalog.title'],
		summary: m['help.catalog.summary'],
		keywords: m['help.catalog.keywords'],
		appHref: '/dashboard/catalog/services',
		steps: [
			m['help.catalog.stepChain'],
			m['help.catalog.stepRecommended'],
			m['help.catalog.stepAdjustments'],
			m['help.catalog.stepEffort'],
		],
		employeeBullets: [
			m['help.catalog.askGarment'],
			m['help.catalog.askService'],
			m['help.catalog.askDuplicate'],
		],
		callouts: [
			{ kind: 'admin', text: m['help.catalog.adminManaged'] },
		],
		related: ['create-order', 'price-lists', 'capacity-scheduling'],
	},
	{
		id: 'price-lists',
		category: 'admin',
		title: m['help.pricelists.title'],
		summary: m['help.pricelists.summary'],
		keywords: m['help.pricelists.keywords'],
		adminOnly: true,
		employeeSummary: m['help.pricelists.employeeSummary'],
		employeeBullets: [
			m['help.pricelists.employeeAskPrice'],
			m['help.pricelists.employeeAskMissing'],
		],
		appHref: '/dashboard/catalog/pricelists',
		steps: [
			m['help.pricelists.stepCreate'],
			m['help.pricelists.stepDates'],
			m['help.pricelists.stepPriority'],
			m['help.pricelists.stepOverrides'],
			m['help.pricelists.stepClone'],
			m['help.pricelists.stepBulk'],
		],
		callouts: [
			{ kind: 'important', text: m['help.pricelists.emptyOverride'] },
		],
		related: ['catalog-dependencies', 'create-order'],
	},
	{
		id: 'capacity-scheduling',
		category: 'admin',
		title: m['help.schedule.title'],
		summary: m['help.schedule.summary'],
		keywords: m['help.schedule.keywords'],
		adminOnly: true,
		employeeSummary: m['help.schedule.employeeSummary'],
		employeeBullets: [
			m['help.schedule.employeeAskDate'],
			m['help.schedule.employeeUseColors'],
		],
		appHref: '/dashboard/admin/schedule',
		steps: [
			m['help.schedule.stepWeekly'],
			m['help.schedule.stepHolidays'],
			m['help.schedule.stepCapacity'],
			m['help.schedule.stepThresholds'],
		],
		callouts: [
			{ kind: 'important', text: m['help.schedule.saturated'] },
		],
		related: ['create-order', 'business-settings'],
	},
	{
		id: 'business-settings',
		category: 'admin',
		title: m['help.business.title'],
		summary: m['help.business.summary'],
		keywords: m['help.business.keywords'],
		adminOnly: true,
		employeeSummary: m['help.business.employeeSummary'],
		employeeBullets: [
			m['help.business.employeeAskTicket'],
			m['help.business.employeeAskBrand'],
		],
		appHref: '/dashboard/admin/settings',
		steps: [
			m['help.business.stepGeneral'],
			m['help.business.stepReceipt'],
			m['help.business.stepBrand'],
			m['help.business.stepThresholds'],
		],
		related: ['delivery-pickup', 'capacity-scheduling'],
	},
	{
		id: 'admin-setup',
		category: 'admin',
		title: m['help.setup.title'],
		summary: m['help.setup.summary'],
		keywords: m['help.setup.keywords'],
		adminOnly: true,
		employeeSummary: m['help.setup.employeeSummary'],
		employeeBullets: [
			m['help.setup.employeeAskCatalog'],
			m['help.setup.employeeAskAccess'],
		],
		appHref: '/dashboard/admin/settings',
		steps: [
			m['help.setup.stepBusiness'],
			m['help.setup.stepSchedule'],
			m['help.setup.stepGarments'],
			m['help.setup.stepServices'],
			m['help.setup.stepPriceLists'],
			m['help.setup.stepUsers'],
			m['help.setup.stepTest'],
		],
		related: ['business-settings', 'catalog-dependencies', 'users-credentials'],
	},
	{
		id: 'users-credentials',
		category: 'admin',
		title: m['help.users.title'],
		summary: m['help.users.summary'],
		keywords: m['help.users.keywords'],
		adminOnly: true,
		employeeSummary: m['help.users.employeeSummary'],
		employeeBullets: [
			m['help.users.employeeCredentials'],
			m['help.users.employeePassword'],
		],
		appHref: '/dashboard/admin/users',
		steps: [
			m['help.users.stepCreate'],
			m['help.users.stepRole'],
			m['help.users.stepEdit'],
			m['help.users.stepPassword'],
		],
		callouts: [
			{ kind: 'important', text: m['help.users.passwordImportant'] },
		],
		related: ['roles-access', 'preferences'],
	},
	{
		id: 'kpi',
		category: 'admin',
		title: m['help.kpi.title'],
		summary: m['help.kpi.summary'],
		keywords: m['help.kpi.keywords'],
		adminOnly: true,
		employeeSummary: m['help.kpi.employeeSummary'],
		employeeBullets: [
			m['help.kpi.employeeSummaryAsk'],
		],
		appHref: '/dashboard/admin/kpi',
		steps: [
			m['help.kpi.stepOperations'],
			m['help.kpi.stepFinance'],
			m['help.kpi.stepCustomers'],
			m['help.kpi.stepRevenueMinute'],
			m['help.kpi.stepAtRisk'],
		],
		related: ['business-settings', 'capacity-scheduling'],
	},
	{
		id: 'preferences',
		category: 'preferences',
		title: m['help.preferences.title'],
		summary: m['help.preferences.summary'],
		keywords: m['help.preferences.keywords'],
		appHref: '/dashboard/settings',
		steps: [
			m['help.preferences.stepTheme'],
			m['help.preferences.stepPalette'],
			m['help.preferences.stepRows'],
			m['help.preferences.stepLanguage'],
		],
		callouts: [
			{ kind: 'important', text: m['help.preferences.local'] },
		],
		related: ['business-settings', 'users-credentials'],
	},
	{
		id: 'troubleshooting',
		category: 'daily',
		title: m['help.trouble.title'],
		summary: m['help.trouble.summary'],
		keywords: m['help.trouble.keywords'],
		related: ['create-order', 'delivery-pickup', 'admin-managed'],
	},
	{
		id: 'admin-managed',
		category: 'admin',
		title: m['help.adminManaged.title'],
		summary: m['help.adminManaged.summary'],
		keywords: m['help.adminManaged.keywords'],
		employeeBullets: [
			m['help.adminManaged.missingGarment'],
			m['help.adminManaged.missingService'],
			m['help.adminManaged.priceIssue'],
			m['help.adminManaged.scheduleIssue'],
			m['help.adminManaged.ticketIssue'],
			m['help.adminManaged.accessIssue'],
		],
		related: ['catalog-dependencies', 'roles-access'],
	},
];

export const helpTerms: HelpTerm[] = [
	{ id: 'order', term: m['help.term.order'], description: m['help.term.orderDesc'] },
	{ id: 'ticket', term: m['help.term.ticket'], description: m['help.term.ticketDesc'] },
	{ id: 'customer', term: m['help.term.customer'], description: m['help.term.customerDesc'] },
	{ id: 'staff', term: m['help.term.staff'], description: m['help.term.staffDesc'] },
	{ id: 'user', term: m['help.term.user'], description: m['help.term.userDesc'] },
	{ id: 'garment', term: m['help.term.garment'], description: m['help.term.garmentDesc'] },
	{ id: 'service', term: m['help.term.service'], description: m['help.term.serviceDesc'] },
	{ id: 'price-list', term: m['help.term.priceList'], description: m['help.term.priceListDesc'] },
	{ id: 'work-order', term: m['help.term.workOrder'], description: m['help.term.workOrderDesc'] },
	{ id: 'payment', term: m['help.term.payment'], description: m['help.term.paymentDesc'] },
	{ id: 'capacity', term: m['help.term.capacity'], description: m['help.term.capacityDesc'] },
	{ id: 'pickup-code', term: m['help.term.pickupCode'], description: m['help.term.pickupCodeDesc'] },
];

export const helpTroubleItems: HelpTroubleItem[] = [
	{ id: 'customer-missing', title: m['help.trouble.customerTitle'], resolution: m['help.trouble.customerFix'] },
	{ id: 'pickup-code', title: m['help.trouble.pickupTitle'], resolution: m['help.trouble.pickupFix'] },
	{ id: 'overpayment', title: m['help.trouble.paymentTitle'], resolution: m['help.trouble.paymentFix'] },
	{ id: 'missing-service', title: m['help.trouble.serviceTitle'], resolution: m['help.trouble.serviceFix'] },
	{ id: 'saturated-day', title: m['help.trouble.capacityTitle'], resolution: m['help.trouble.capacityFix'] },
	{ id: 'locked-order', title: m['help.trouble.lockedTitle'], resolution: m['help.trouble.lockedFix'] },
	{ id: 'admin-option', title: m['help.trouble.adminTitle'], resolution: m['help.trouble.adminFix'] },
	{ id: 'drafts', title: m['help.trouble.draftTitle'], resolution: m['help.trouble.draftFix'] },
];
