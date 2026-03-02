export interface EvnexElectricityTariff {
  start: number;
  rate: number;
  type: string; // Flat
}

export interface EvnexElectricityCost {
  currency: string; // NZD
  tariffs: EvnexElectricityTariff[];
  tariffType: string;
  cost?: number | null;
}

export interface EvnexElectricityCostTotal {
  currency: string; // NZD
  amount: number;
  distribution?: any;
}