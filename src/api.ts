import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  AuthFlowType,
} from "@aws-sdk/client-cognito-identity-provider";
import axios from "axios";
import pkg from "../package.json";
import type { AxiosInstance } from "axios";
import { NotAuthorizedException } from "./errors";
import Logger from "./logger";
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
import type { EvnexCommandResponse } from "./schema/commands";
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

import type { EvnexV3APIResponse } from "./schema/v3/generic";
import { process } from "zod/v4/core";

const BASE_URL = "https://client-api.evnex.io";
const DEFAULT_USER_POOL_ID = "ap-southeast-2_zWnqo6ASv";
const DEFAULT_CLIENT_ID = "rol3lsv2vg41783550i18r7vi";

const logger = new Logger("evnex.api");

export interface EvnexConfig {
  baseUrl?: string;
  cognitoUserPoolId?: string;
  cognitoClientId?: string;
  cognitoRegion?: string;
  orgId?: string;
}

export interface EvnexTokens {
  idToken: string;
  accessToken: string;
  refreshToken: string;
}

export class Evnex {
  private client: AxiosInstance;
  private tokens: EvnexTokens;
  private orgId?: string;
  private readonly username: string;
  private readonly password: string;
  private readonly clientId: string;
  private readonly cognito: CognitoIdentityProviderClient;

  constructor(
    username: string,
    password: string,
    tokens?: EvnexTokens,
    config: EvnexConfig = {}
  ) {
    this.username = username;
    this.password = password;
    this.orgId = config.orgId;
    this.clientId = config.cognitoClientId ?? DEFAULT_CLIENT_ID;

    const region = config.cognitoRegion ?? (config.cognitoUserPoolId ?? DEFAULT_USER_POOL_ID).split("_")[0];

    this.cognito = new CognitoIdentityProviderClient({ region });
    this.client = axios.create({ baseURL: config.baseUrl ?? BASE_URL });

    // Tokens will be populated by authenticate() if not provided
    this.tokens = tokens ?? { idToken: "", accessToken: "", refreshToken: "" };

    logger.debug("Creating evnex api instance");
  }

  /**
   * Authenticate with Cognito and populate tokens.
   * Call this after constructing if you don't have existing tokens.
   *
   * @throws NotAuthorizedException
   */
  async authenticate(): Promise<void> {
    logger.debug("Authenticating to EVNEX cloud api");
    try {
      const command = new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        ClientId: this.clientId,
        AuthParameters: {
          USERNAME: this.username,
          PASSWORD: this.password,
        },
      });

      const response = await this.cognito.send(command);
      const result = response.AuthenticationResult;

      if (!result?.AccessToken || !result?.IdToken || !result?.RefreshToken) {
        throw new NotAuthorizedException("Authentication succeeded but tokens were missing");
      }

      this.tokens = {
        accessToken: result.AccessToken,
        idToken: result.IdToken,
        refreshToken: result.RefreshToken,
      };

      logger.debug("Authentication successful");
    } catch (err) {
      if (err instanceof NotAuthorizedException) throw err;
      logger.error(`Authentication failed: ${err}`);
      throw new NotAuthorizedException(`Authentication failed: ${err}`);
    }
  }

  /**
   * Refresh tokens using the stored refresh token.
   *
   * @throws NotAuthorizedException
   */
  async refreshTokens(): Promise<void> {
    logger.debug("Refreshing tokens");
    try {
      const command = new InitiateAuthCommand({
        AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
        ClientId: this.clientId,
        AuthParameters: {
          REFRESH_TOKEN: this.tokens.refreshToken,
        },
      });

      const response = await this.cognito.send(command);
      const result = response.AuthenticationResult;

      if (!result?.AccessToken || !result?.IdToken) {
        throw new NotAuthorizedException("Token refresh succeeded but tokens were missing");
      }

      this.tokens = {
        accessToken: result.AccessToken,
        idToken: result.IdToken,
        refreshToken: result.RefreshToken ?? this.tokens.refreshToken, // refresh token may not rotate
      };

      logger.debug("Token refresh successful");
    } catch (err) {
      if (err instanceof NotAuthorizedException) throw err;
      logger.warn(`Token refresh failed, re-authenticating: ${err}`);
      await this.authenticate();
    }
  }

  get accessToken(): string { return this.tokens.accessToken; }
  get idToken(): string { return this.tokens.idToken; }
  get refreshToken(): string { return this.tokens.refreshToken; }

  private get commonHeaders() {
    return {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: this.tokens.accessToken,
      "User-Agent": `ts-evnex/${pkg.version}`,
    };
  }

  private async checkApiResponse<T>(response: { status: number; data: T }): Promise<T> {
    if (response.status === 401) {
      logger.debug("Access token likely expired, attempting refresh");
      await this.refreshTokens();
      throw new NotAuthorizedException("Access token expired - tokens refreshed, please retry");
    }
    if (response.status < 200 || response.status >= 300) {
      logger.warn(`Unsuccessful request\n${response.status}\n${JSON.stringify(response.data)}`);
    }
    return response.data;
  }

  async getUserDetail(): Promise<EvnexUserDetail> {
    const response = await this.client.get("/v2/apps/user", {
      headers: this.commonHeaders,
    });
    const data = ((await this.checkApiResponse(response)) as EvnexGetUserResponse).data;

    if (data.organisations.length) {
      this.orgId = data.organisations[0]?.id;
      logger.debug(`Defaulting to org: ${this.orgId}`);
    }

    return data;
  }

  async getOrgChargePoints(orgId?: string): Promise<EvnexChargePoint[]> {
    const id = orgId ?? this.orgId;
    logger.debug("Listing org charge points");
    const response = await this.client.get(
      `/v2/apps/organisations/${id}/charge-points`,
      { headers: this.commonHeaders }
    );
    const data = (await this.checkApiResponse(response)) as EvnexGetChargePointsResponse;
    return data.data.items;
  }

  async getOrgInsight(
    days: number,
    orgId?: string,
    tzOffset: number = 12
  ): Promise<EvnexOrgInsightEntry[]> {
    const id = orgId ?? this.orgId;
    logger.debug("Getting org insight");
    const response = await this.client.get(
      `/organisations/${id}/summary/insights`,
      { headers: this.commonHeaders, params: { days, "tz-offset": tzOffset } }
    );
    const data = (await this.checkApiResponse(response)) as EvnexGetOrgInsights;
    return data.data.map((insight) => insight.attributes);
  }

  async getOrgSummaryStatus(orgId?: string): Promise<EvnexOrgSummaryStatus> {
    const id = orgId ?? this.orgId;
    logger.debug("Getting org summary status");
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
    logger.debug(`Fetching charge point detail for ${chargePointId}`);
    const response = await this.client.get(`/charge-points/${chargePointId}`, {
      headers: this.commonHeaders,
    });
    logger.debug(`Raw get charge point detail response.\n${response.status}\n${JSON.stringify(response.data)}`);
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
    logger.info("Stopping charging session");
    const response = await this.client.post(
      `/v2/apps/organisations/${id}/charge-points/${chargePointId}/commands/remote-stop-transaction`,
      { connectorId },
      { headers: this.commonHeaders, timeout }
    );
    const data = (await this.checkApiResponse(response)) as { data: EvnexCommandResponse };
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
    logger.info(`Changing connector ${connectorId} to ${availability}`);
    const response = await this.client.post(
      `/v2/apps/organisations/${orgId}/charge-points/${chargePointId}/commands/change-availability`,
      { connectorId, changeAvailabilityType: availability },
      { headers: this.commonHeaders, timeout }
    );
    const data = (await this.checkApiResponse(response)) as { data: EvnexCommandResponse };
    return data.data;
  }

  async unlockCharger(
    chargePointId: string,
    available: boolean = true,
    connectorId: string = "0",
    timeout: number = 10000
  ): Promise<EvnexCommandResponse> {
    const availability = available ? "Operative" : "Inoperative";
    logger.info(`Changing connector ${connectorId} to ${availability}`);
    const response = await this.client.post(
      `/v2/apps/organisations/${this.orgId}/charge-points/${chargePointId}/commands/unlock-connector`,
      { connectorId, changeAvailabilityType: availability },
      { headers: this.commonHeaders, timeout }
    );
    const data = (await this.checkApiResponse(response)) as { data: EvnexCommandResponse };
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
    logger.info("Applying load management profile");
    const response = await this.client.put(
      `/v2/apps/charge-points/${chargePointId}/load-management`,
      { chargingProfilePeriods, enabled, units, duration },
      { headers: this.commonHeaders, timeout }
    );
    const data = (await this.checkApiResponse(response)) as { data: EvnexChargePointLoadSchedule };
    return data.data;
  }

  async setChargePointSchedule(
    chargePointId: string,
    chargingProfilePeriods: EvnexChargeProfileSegment[],
    enabled: boolean = true,
    duration: number = 86400,
    timeout: number = 10000
  ): Promise<EvnexChargePointLoadSchedule> {
    logger.info("Applying charge schedule");
    const response = await this.client.put(
      `/v2/apps/charge-points/${chargePointId}/charge-schedule`,
      { chargingProfilePeriods, enabled, duration },
      { headers: this.commonHeaders, timeout }
    );
    const data = (await this.checkApiResponse(response)) as { data: EvnexChargePointLoadSchedule };
    return data.data;
  }
}