import type { EvnexCost } from "./cost";

export interface EvnexOrgBrief {
    id: string;
    isDefault: boolean;
    role: number;
    createdDate: Date;
    name: string;
    slug: string;
    tier: number;
    tierDetails: any | null;
    updatedDate: Date;
}

export interface EvnexOrgInsightEntry {
    carbonOffset: number;
    cost: EvnexCost;
    duration: number;
    powerUsage: number;
    sessions: number;
    startDate: Date;
}

export interface EvnexInsightAttributeWrapper {
    attributes: EvnexOrgInsightEntry;
}

export interface EvnexOrgSummaryStatus {
    charging: number;
    available: number;
    disabled: number;
    faulted: number;
    occupied: number;
    offline: number;
    reserved: number;
}

export interface EvnexGetOrgInsights {
    data: EvnexInsightAttributeWrapper[];
}

export interface EvnexGetOrgSummaryStatusResponse {
    data: EvnexOrgSummaryStatus;
}
