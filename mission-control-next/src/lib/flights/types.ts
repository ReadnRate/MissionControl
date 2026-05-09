export type FlightSearchOrigin = "CUN" | "YUL" | "CUN_YUL";
export type FlightTripType = "one_way" | "round_trip";
export type FlightTicketType =
  | "single_pnr"
  | "multi_pnr"
  | "self_transfer"
  | "separate_tickets"
  | "combo";
export type FlightModifiable =
  | "oui_gratuit"
  | "oui_avec_frais"
  | "non_modifiable"
  | "depend_tarif"
  | "a_verifier";
export type FlightRiskLevel = "faible" | "moyen" | "eleve";

export interface FlightOption {
  id: number;
  search_origin: FlightSearchOrigin;
  option_rank: number;
  option_name: string;
  is_recommended: boolean | null;
  recommendation_type: string | null;
  airlines: string[];
  ticket_type: FlightTicketType;
  alliance: string | null;
  price_cad_min: number;
  price_cad_max: number;
  price_cad_confirmed: number | null;
  baggage_23kg_included: boolean | null;
  baggage_notes: string | null;
  total_duration_hours: string | number;
  num_stops: number;
  recommended_dates: string | null;
  operating_days: string | null;
  has_largebody_longhaul: boolean | null;
  aircraft_summary: string | null;
  back_pain_score: number | null;
  reliability_score: number | null;
  risk_level: FlightRiskLevel | null;
  advantages: string[] | null;
  disadvantages: string[] | null;
  warnings: string[] | null;
  booking_url: string | null;
  booking_phone: string | null;
  notes: string | null;
  trip_type: FlightTripType | null;
  return_date_note: string | null;
  price_note: string | null;
  return_modifiable: FlightModifiable | null;
  change_fee_estimate: string | null;
  change_policy_notes: string | null;
  updated_at: string | null;
}

export interface FlightSegment {
  id: number;
  flight_option_id: number;
  segment_order: number;
  airline_code: string | null;
  airline_name: string;
  flight_number: string | null;
  origin_airport: string;
  origin_city: string | null;
  destination_airport: string;
  destination_city: string | null;
  departure_time: string | null;
  arrival_time: string | null;
  duration_hours: string | number | null;
  aircraft_type: string | null;
  aircraft_category: "large-body" | "narrow-body" | null;
  layover_after_hours: string | number | null;
  layover_notes: string | null;
}

export interface PriceReference {
  id: number;
  flight_option_id: number | null;
  search_origin: string;
  route_description: string;
  price_cad: string | number;
  source: string;
  date_observed: string;
  notes: string | null;
}

export interface TravelConstraint {
  id: number;
  constraint_type: "forbidden" | "allowed" | "preference";
  category: string;
  value: string;
  reason: string | null;
}

export type FreshnessLevel = "fresh" | "stale" | "old" | "none";

export function freshnessFor(daysSince: number | null): FreshnessLevel {
  if (daysSince === null) return "none";
  if (daysSince < 3) return "fresh";
  if (daysSince <= 14) return "stale";
  return "old";
}
