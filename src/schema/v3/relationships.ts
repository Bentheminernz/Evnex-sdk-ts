export interface EvnexRelationship {
  id: string;
  type: string;
}

export interface EvnexRelationshipWrapper {
  data?: EvnexRelationship | null;
}

export interface EvnexRelationships {
  chargePoint?: EvnexRelationshipWrapper | null;
  location?: EvnexRelationshipWrapper | null;
  organisation?: EvnexRelationshipWrapper | null;
}