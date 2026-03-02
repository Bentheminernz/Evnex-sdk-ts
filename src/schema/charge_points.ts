import type { EvnexCost } from "./cost";

// Enums
export enum ChargingLogic {
  UNAVAILABLE = "Unavailable",
  NOVEHICLE = "NoVehicle",
  VEHICLE = "Vehicle",
  TRANSFER = "Transfer",
  FAULT = "Fault",
}

export enum ChargingCurrentControl {
  FULLPOWER = "FullPower",
  THERMALLIMITED = "ThermalLimited",
  LLMLIMITED = "LLMLimited",
  WAITINGSCHEDULE = "WaitingSchedule",
  WAITINGSOLAR = "WaitingSolar",
  SOLARCONTROL = "SolarControl",
  SCHEDULELIMITED = "ScheduleLimited",
  SUPPLYLIMITED = "SupplyLimited",
}

export enum E2LEDState {
  OFF = "Off",
  IDLE = "Idle",
  CHARGING = "Charging",
  CHARGENOWCHARGING = "ChargeNowCharging",
  CHARGENOWNOTCHARGING = "ChargeNowNotCharging",
  FAULT = "Fault",
  DISABLED = "Disabled",
  WAITSCHEDULE = "WaitSchedule",
  WAITSOLAR = "WaitSolar",
  WAITVEHICLE = "WaitVehicle",
  SHUTTINGDOWN = "ShuttingDown",
}

export enum AntiSleepState {
  DISABLED = "Disabled",
  ENABLED = "Enabled",
  ACTIVE = "Active",
  NA = "NA",
}

// Interfaces
export interface ChargePointStatus {
  chargeNow: boolean;
  chargingLogic: ChargingLogic;
  chargingCurrentControl: ChargingCurrentControl;
  LEDState: E2LEDState;
  AntiSleep: AntiSleepState;
}

export interface EvnexChargePointConnectorMeter {
  powerType: string; // "AC_1_PHASE"
  updatedDate: Date;
  power: number;
  register: number; // raw_register aliased from "register"
  frequency: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface EvnexAddress {
  address1: string;
  address2?: string | null;
  city?: string | null;
  postCode?: string | null;
  state?: string | null;
  country: string;
}

export interface EvnexLocation {
  id: string;
  name: string;
  createdDate: Date;
  updatedDate: Date;
  address?: EvnexAddress | null;
  coordinates?: Coordinates | null;
  chargePointCount: number;
}

export interface EvnexChargePointConnector {
  powerType: string; // AC_1_PHASE
  connectorId: string;
  evseId: string;
  updatedDate: Date;
  connectorType: string;
  amperage: number;
  voltage: number;
  connectorFormat: string;
  ocppStatus: string;
  status: string; // OCCUPIED, CHARGING
  ocppCode: string; // CHARGING
  meter: EvnexChargePointConnectorMeter;
}

export interface EvnexChargePointDetails {
  model: string;
  vendor: string;
  firmware: string;
  iccid?: string | null;
}

export interface EvnexChargePointSolarConfig {
  solarWithSchedule: boolean;
  powerSensorInstalled: boolean;
  solarStartExportPower: number;
  solarStopImportPower: number;
}

export interface EvnexChargePointOverrideConfig {
  chargeNow: boolean | "NotSupported";
}

export interface EvnexChargePointStatus {
  commandResultStatus: string;
  chargePointStatus?: ChargePointStatus | null;
}

export interface EvnexChargePointStatusResponse {
  data: EvnexChargePointStatus;
}

export interface EvnexChargePointBase {
  id: string;
  createdDate: Date;
  updatedDate: Date;
  networkStatusUpdatedDate: Date;
  name: string;
  ocppChargePointId: string;
  serial: string;
  networkStatus: string; // ONLINE
  location: EvnexLocation;
}

export interface EvnexChargePoint extends EvnexChargePointBase {
  details: EvnexChargePointDetails;
  connectors?: EvnexChargePointConnector[] | null;
  lastHeard?: Date | null;
  maxCurrent: number;
  tokenRequired: boolean;
  needsRegistrationInformation: boolean;
}

export interface EvnexGetChargePointsItem {
  items: EvnexChargePoint[];
}

export interface EvnexGetChargePointsResponse {
  data: EvnexGetChargePointsItem;
}

export interface EvnexElectricityCostSegment {
  cost: number;
  start: number;
}

export interface EvnexChargeProfileSegment {
  limit: number;
  start: number;
}

export interface EvnexElectricityCost {
  currency: string;
  duration?: number | null;
  costs: EvnexElectricityCostSegment[];
}

export interface EvnexChargePointConfiguration {
  maxCurrent: number;
  plugAndCharge: boolean;
}

export interface EvnexChargePointLoadSchedule {
  duration: number;
  enabled: boolean;
  timezone: string;
  units: string;
  chargingProfilePeriods: EvnexChargeProfileSegment[];
}

export interface EvnexChargePointDetail extends EvnexChargePointBase {
  configuration: EvnexChargePointConfiguration;
  electricityCost: EvnexElectricityCost;
  loadSchedule: EvnexChargePointLoadSchedule;
  connectors: EvnexChargePointConnector[];
}

export interface EvnexGetChargePointDetailResponse {
  data: EvnexChargePointDetail;
}

export interface EvnexChargePointTransaction {
  id: string;
  connectorId: string;
  endDate?: Date | null;
  evseId: string;
  powerUsage: number;
  reason?: string | null; // EVDisconnected, Other
  startDate: Date;
  carbonOffset?: number | null;
  electricityCost?: EvnexCost | null; // import from your cost schema
}

export interface EvnexChargePointTransactions {
  items: EvnexChargePointTransaction[];
}

export interface EvnexGetChargePointTransactionsResponse {
  data: EvnexChargePointTransactions;
}