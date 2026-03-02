import axios from "axios";
import type { AxiosInstance } from "axios";
import { NotAuthorizedException } from "./errors";
import type {
  EvnexChargePoint,
  EvnexChargePointDetail,
  EvnexChargePointLoadSchedule,
  EvnexChargePointOverrideConfig,
  EvnexChargePointSolarConfig,
  EvnexChargeProfileSegment,
  EvnexChargePointTransaction,
  EvnexGetChargePointTransactionsResponse,
  EvnexGetChargePointDetailResponse,
  EvnexGetChargePointsResponse,
  EvnexChargePointStatusResponse,
} from "./schema/charge_points";
import type {
  EvnexOrgInsightEntry,
  EvnexGetOrgSummaryStatusResponse,
  EvnexGetOrgInsights,
  EvnexOrgSummaryStatus,
} from "./schema/org";
import type { EvnexGetUserResponse, EvnexUserDetail } from "./schema/user";
import type {
  EvnexChargePointDetail as EvnexChargePointDetailV3,
  EvnexGetChargePointSessionsResponse,
  EvnexChargePointSession,
} from "./schema/v3/charge_points";
import type { EvnexCommandResponse } from "./schema/commands";
import type { EvnexV3APIResponse } from "./schema/v3/generic";

const BASE_URL = "https://client-api.evnex.io";

export interface EvnexConfig {
  baseUrl?: string;
  cognitoUserPoolId?: string;
  cognitoClientId?: string;
  orgId?: string;
}

export interface EvnexTokens {
  idToken: string;
  accessToken: string;
  refreshToken: string;
}

const DEFAULT_CONFIG: Required<Omit<EvnexConfig, "orgId">> = {
  baseUrl: BASE_URL,
  cognitoUserPoolId: "ap-southeast-2_zWnqo6ASv",
  cognitoClientId: "rol3lsv2vg41783550i18r7vi",
};

export class Evnex {
  private client: AxiosInstance;
  private tokens: EvnexTokens;
  private orgId?: string;
  private config: Required<Omit<EvnexConfig, "orgId">>;

  constructor(tokens: EvnexTokens, config: EvnexConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.orgId = config.orgId;
    this.tokens = tokens;
    this.client = axios.create({ baseURL: this.config.baseUrl });
  }

  private get commonHeaders() {
    return {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: this.tokens.accessToken,
    };
  }

  private async checkApiResponse<T>(response: { status: number; data: T }): Promise<T> {
    if (response.status === 401) {
      throw new NotAuthorizedException("Access token expired or invalid");
    }
    return response.data;
  }

  async getUserDetail(): Promise<EvnexUserDetail> {
    const response = await this.client.get("/v2/apps/user", {
      headers: this.commonHeaders,
    });
    const data = (await this.checkApiResponse(response) as EvnexGetUserResponse).data;

    if (data.organisations.length) {
      this.orgId = data.organisations[0]?.id;
    }

    return data;
  }

  async getOrgChargePoints(orgId?: string): Promise<EvnexChargePoint[]> {
    const id = orgId ?? this.orgId;
    const response = await this.client.get(
      `/v2/apps/organisations/${id}/charge-points`,
      { headers: this.commonHeaders }
    );
    const data = await this.checkApiResponse(response) as EvnexGetChargePointsResponse;
    return data.data.items;
  }

  async getOrgInsight(
    days: number,
    orgId?: string,
    tzOffset: number = 12
  ): Promise<EvnexOrgInsightEntry[]> {
    const id = orgId ?? this.orgId;
    const response = await this.client.get(
      `/organisations/${id}/summary/insights`,
      { headers: this.commonHeaders, params: { days, "tz-offset": tzOffset } }
    );
    const data = await this.checkApiResponse(response) as EvnexGetOrgInsights;
    return data.data.map((insight) => insight.attributes);
  }

  async getOrgSummaryStatus(orgId?: string): Promise<EvnexOrgSummaryStatus> {
    const id = orgId ?? this.orgId;
    const response = await this.client.get(
      `/v2/apps/organisations/${id}/summary/status`,
      { headers: this.commonHeaders }
    );
    return ((await this.checkApiResponse(response)) as EvnexGetOrgSummaryStatusResponse).data;
  }

  /** @deprecated Use getChargePointDetailV3 */
  async getChargePointDetail(chargePointId: string): Promise<EvnexChargePointDetail> {
    const response = await this.client.get(
      `/v2/apps/charge-points/${chargePointId}`,
      { headers: this.commonHeaders }
    );
    return ((await this.checkApiResponse(response)) as EvnexGetChargePointDetailResponse).data;
  }

  async getChargePointDetailV3(
    chargePointId: string
  ): Promise<EvnexV3APIResponse<EvnexChargePointDetailV3>> {
    const response = await this.client.get(`/charge-points/${chargePointId}`, {
      headers: this.commonHeaders,
    });
    return this.checkApiResponse(response) as Promise<EvnexV3APIResponse<EvnexChargePointDetailV3>>;
  }

  async getChargePointSolarConfig(chargePointId: string): Promise<EvnexChargePointSolarConfig> {
    const response = await this.client.post(
      `/charge-points/${chargePointId}/commands/get-solar`,
      null,
      { headers: this.commonHeaders }
    );
    return this.checkApiResponse(response) as Promise<EvnexChargePointSolarConfig>;
  }

  async getChargePointOverride(chargePointId: string): Promise<EvnexChargePointOverrideConfig> {
    const response = await this.client.post(
      `/charge-points/${chargePointId}/commands/get-override`,
      null,
      { headers: this.commonHeaders, timeout: 15000 }
    );
    return this.checkApiResponse(response) as Promise<EvnexChargePointOverrideConfig>;
  }

  async setChargePointOverride(
    chargePointId: string,
    chargeNow: boolean,
    connectorId: number = 1
  ): Promise<true> {
    await this.client.post(
      `/charge-points/${chargePointId}/commands/set-override`,
      { connectorId, chargeNow },
      { headers: this.commonHeaders }
    );
    return true;
  }

  async getChargePointStatus(chargePointId: string): Promise<EvnexChargePointStatusResponse> {
    const response = await this.client.post(
      `/charge-points/${chargePointId}/commands/get-status`,
      null,
      { headers: this.commonHeaders }
    );
    return this.checkApiResponse(response) as Promise<EvnexChargePointStatusResponse>;
  }

  /** @deprecated Use getChargePointSessions */
  async getChargePointTransactions(chargePointId: string): Promise<EvnexChargePointTransaction[]> {
    const response = await this.client.get(
      `/v2/apps/charge-points/${chargePointId}/transactions`,
      { headers: this.commonHeaders }
    );
    return ((await this.checkApiResponse(response)) as EvnexGetChargePointTransactionsResponse).data.items;
  }

  async getChargePointSessions(chargePointId: string): Promise<EvnexChargePointSession[]> {
    const response = await this.client.get(
      `/charge-points/${chargePointId}/sessions`,
      { headers: this.commonHeaders }
    );
    return ((await this.checkApiResponse(response)) as EvnexGetChargePointSessionsResponse).data;
  }

  async stopChargePoint(
    chargePointId: string,
    orgId?: string,
    connectorId: string = "1",
    timeout: number = 10000
  ): Promise<EvnexCommandResponse> {
    const id = orgId ?? this.orgId;
    const response = await this.client.post(
      `/v2/apps/organisations/${id}/charge-points/${chargePointId}/commands/remote-stop-transaction`,
      { connectorId },
      { headers: this.commonHeaders, timeout }
    );
    const data = await this.checkApiResponse(response) as { data: EvnexCommandResponse };
    return data.data;
  }

  async enableCharger(orgId: string, chargePointId: string, connectorId: number | string = 1) {
    return this.setChargerAvailability(orgId, chargePointId, true, connectorId);
  }

  async disableCharger(orgId: string, chargePointId: string, connectorId: number | string = 1) {
    return this.setChargerAvailability(orgId, chargePointId, false, connectorId);
  }

  async setChargerAvailability(
    orgId: string,
    chargePointId: string,
    available: boolean = true,
    connectorId: number | string = 1,
    timeout: number = 10000
  ): Promise<EvnexCommandResponse> {
    const availability = available ? "Operative" : "Inoperative";
    const response = await this.client.post(
      `/v2/apps/organisations/${orgId}/charge-points/${chargePointId}/commands/change-availability`,
      { connectorId, changeAvailabilityType: availability },
      { headers: this.commonHeaders, timeout }
    );
    const data = await this.checkApiResponse(response) as { data: EvnexCommandResponse };
    return data.data;
  }

  async unlockCharger(
    chargePointId: string,
    available: boolean = true,
    connectorId: string = "0",
    timeout: number = 10000
  ): Promise<EvnexCommandResponse> {
    const availability = available ? "Operative" : "Inoperative";
    const response = await this.client.post(
      `/v2/apps/organisations/${this.orgId}/charge-points/${chargePointId}/commands/unlock-connector`,
      { connectorId, changeAvailabilityType: availability },
      { headers: this.commonHeaders, timeout }
    );
    const data = await this.checkApiResponse(response) as { data: EvnexCommandResponse };
    return data.data;
  }

  async setChargerLoadProfile(
    chargePointId: string,
    chargingProfilePeriods: EvnexChargeProfileSegment[],
    enabled: boolean = true,
    duration: number = 86400,
    units: string = "A",
    timeout: number = 10000
  ): Promise<EvnexChargePointLoadSchedule> {
    const response = await this.client.put(
      `/v2/apps/charge-points/${chargePointId}/load-management`,
      { chargingProfilePeriods, enabled, units, duration },
      { headers: this.commonHeaders, timeout }
    );
    const data = await this.checkApiResponse(response) as { data: EvnexChargePointLoadSchedule };
    return data.data;
  }

  async setChargePointSchedule(
    chargePointId: string,
    chargingProfilePeriods: EvnexChargeProfileSegment[],
    enabled: boolean = true,
    duration: number = 86400,
    timeout: number = 10000
  ): Promise<EvnexChargePointLoadSchedule> {
    const response = await this.client.put(
      `/v2/apps/charge-points/${chargePointId}/charge-schedule`,
      { chargingProfilePeriods, enabled, duration },
      { headers: this.commonHeaders, timeout }
    );
    const data = await this.checkApiResponse(response) as { data: EvnexChargePointLoadSchedule };
    return data.data;
  }
}