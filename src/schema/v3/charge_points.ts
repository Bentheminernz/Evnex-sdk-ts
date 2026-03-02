import type { EvnexRelationships } from "./relationships";
import type { EvnexElectricityCost, EvnexElectricityCostTotal } from "./cost";

export interface EvnexEnergyTransaction {
  meterStart: number;
  startDate: Date;
  meterStop?: number | null;
  endDate?: Date | null;
  reason?: string | null;
}

export interface EvnexEnergyUsage {
  total: number;
  distributionByTariff?: any | null;
  distributionByEnergySource?: any | null;
}

export interface EvnexChargeSchedulePeriod {
  limit: number;
  startPeriod: number;
}

export interface EvnexChargeSchedule {
  enabled: boolean;
  chargingSchedulePeriods: EvnexChargeSchedulePeriod[];
}

export interface EvnexChargeProfile {
  chargeSchedule?: EvnexChargeSchedule | null;
}

export interface EvnexChargePointConnectorMeter {
  currentL1?: number | null;
  currentL2?: number | null;
  currentL3?: number | null;
  frequency: number;
  power: number;
  register: number; // aliased from raw_register
  updatedDate: Date;
  temperature?: number | null;
  voltageL1N?: number | null;
  voltageL2N?: number | null;
  voltageL3N?: number | null;
}

export interface EvnexChargePointConnector {
  evseId: string;
  connectorFormat: string; // CABLE
  connectorType: string;
  ocppStatus: string;
  powerType: string; // AC_1_PHASE
  connectorId: string;
  ocppCode: string; // CHARGING
  updatedDate: Date;
  meter: EvnexChargePointConnectorMeter;
  maxVoltage: number;
  maxAmperage: number;
}

export interface EvnexChargePointDetail {
  connectors: EvnexChargePointConnector[];
  createdDate: Date;
  electricityCost: EvnexElectricityCost;
  firmware: string;
  maxCurrent: number;
  model: string;
  name: string;
  networkStatus: string;
  networkStatusUpdatedDate: Date;
  ocppChargePointId: string;
  profiles: EvnexChargeProfile;
  serial: string;
  timeZone: string;
  tokenRequired: boolean;
  updatedDate: Date;
  vendor: string;
  iccid?: string | null;
}

export interface EvnexChargePointSessionAttributes {
  totalCarbonUsage?: number | null;
  chargingStarted?: Date | null;
  chargingStopped?: Date | null;
  connectorId?: string | null;
  createdDate?: Date | null;
  evseId?: string | null;
  sessionStatus?: string | null;
  startDate?: Date | null;
  updatedDate?: Date | null;
  authorizationMethod?: string | null;
  electricityCost?: EvnexElectricityCost | null;
  endDate?: Date | null;
  totalChargingTime?: number | null;
  totalDuration?: number | null;
  totalEnergyUsage?: EvnexEnergyUsage | null;
  totalCost?: EvnexElectricityCostTotal | null;
  totalPowerUsage?: number | null;
  transaction?: EvnexEnergyTransaction | null;
}

export interface EvnexChargePointSession {
  attributes: EvnexChargePointSessionAttributes;
  id: string;
  type: string;
  relationships?: EvnexRelationships | null;
}

export interface EvnexGetChargePointSessionsResponse {
  data: EvnexChargePointSession[];
}