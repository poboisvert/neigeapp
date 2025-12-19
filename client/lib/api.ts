export interface StreetFeature {
  type: "Feature";
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
  properties: {
    COTE_RUE_ID: number;
    ID_TRC: number;
    ID_VOIE: number;
    NOM_VOIE: string;
    NOM_VILLE: string;
    DEBUT_ADRESSE: number;
    FIN_ADRESSE: number;
    COTE: string;
    TYPE_F: string;
    SENS_CIR: number;
  };
}

export interface PlanificationResponse {
  munid: number;
  coteRueId: number;
  etatDeneig: number;
  status: string;
  dateDebutPlanif: string | null;
  dateFinPlanif: string | null;
  dateDebutReplanif: string | null;
  dateFinReplanif: string | null;
  dateMaj: string;
  streetFeature?: StreetFeature;
}
