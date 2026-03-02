import type { EvnexRelationships } from "./relationships";

export interface EvnexV3Include {
    id: string;
    type: string;
    attributes: Record<string, unknown>;
}

export interface EvnexV3Data<T> {
  id: string;
  type: string;
  attributes: T;
  relationships: EvnexRelationships;
}

export interface EvnexV3APIResponse<T> {
  data: EvnexV3Data<T>;
  included?: EvnexV3Include[] | null;
}