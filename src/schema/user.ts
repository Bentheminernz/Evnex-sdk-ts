import type { EvnexOrgBrief } from "./org";

export interface EvnexUserDetail {
    id: string;
    createdDate: Date;
    updatedDate: Date;
    name: string;
    email: string;
    organisations: EvnexOrgBrief[];
    type: "User" | "Installer";
}

export interface EvnexGetUserResponse {
    data: EvnexUserDetail;
}