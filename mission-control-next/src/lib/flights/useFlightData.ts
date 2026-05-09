"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import type {
  FlightOption,
  FlightSegment,
  PriceReference,
  TravelConstraint,
} from "./types";

interface FlightData {
  options: FlightOption[];
  segments: FlightSegment[];
  prices: PriceReference[];
  constraints: TravelConstraint[];
  loading: boolean;
  error: string | null;
  lastRefresh: Date;
  refresh: () => void;
  realtimeConnected: boolean;
}

export function useFlightData(): FlightData {
  const [options, setOptions] = useState<FlightOption[]>([]);
  const [segments, setSegments] = useState<FlightSegment[]>([]);
  const [prices, setPrices] = useState<PriceReference[]>([]);
  const [constraints, setConstraints] = useState<TravelConstraint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [opts, segs, prc, cons] = await Promise.all([
        supabase
          .from("flight_options")
          .select("*")
          .order("search_origin", { ascending: true })
          .order("option_rank", { ascending: true }),
        supabase
          .from("flight_segments")
          .select("*")
          .order("flight_option_id", { ascending: true })
          .order("segment_order", { ascending: true }),
        supabase
          .from("price_references")
          .select("*")
          .order("date_observed", { ascending: false }),
        supabase
          .from("travel_constraints")
          .select("*")
          .order("constraint_type", { ascending: true }),
      ]);

      if (cancelled) return;

      const firstError = opts.error || segs.error || prc.error || cons.error;
      if (firstError) {
        setError(firstError.message);
        setLoading(false);
        return;
      }

      setOptions((opts.data ?? []) as FlightOption[]);
      setSegments((segs.data ?? []) as FlightSegment[]);
      setPrices((prc.data ?? []) as PriceReference[]);
      setConstraints((cons.data ?? []) as TravelConstraint[]);
      setError(null);
      setLastRefresh(new Date());
      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    const channel = supabase
      .channel("flight_data_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "flight_options" },
        () => setRefreshKey((k) => k + 1),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "flight_segments" },
        () => setRefreshKey((k) => k + 1),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "price_references" },
        () => setRefreshKey((k) => k + 1),
      )
      .subscribe((status) => {
        setRealtimeConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return useMemo(
    () => ({
      options,
      segments,
      prices,
      constraints,
      loading,
      error,
      lastRefresh,
      refresh,
      realtimeConnected,
    }),
    [
      options,
      segments,
      prices,
      constraints,
      loading,
      error,
      lastRefresh,
      refresh,
      realtimeConnected,
    ],
  );
}
