import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const revalidate = 3600; // Revalidate every hour

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeSnowStatus = searchParams.get("include_snow") === "true";

    // Get bounding box parameters (minLat, minLng, maxLat, maxLng)
    const minLat = searchParams.get("minLat");
    const minLng = searchParams.get("minLng");
    const maxLat = searchParams.get("maxLat");
    const maxLng = searchParams.get("maxLng");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // If bounding box is provided, use PostGIS spatial query via RPC
    if (minLat && minLng && maxLat && maxLng) {
      const minLatNum = parseFloat(minLat);
      const minLngNum = parseFloat(minLng);
      const maxLatNum = parseFloat(maxLat);
      const maxLngNum = parseFloat(maxLng);

      // Call the Postgres function via RPC
      const { data, error } = await supabase.rpc("get_streets_in_bbox", {
        min_lng: minLngNum,
        min_lat: minLatNum,
        max_lng: maxLngNum,
        max_lat: maxLatNum,
        include_snow: includeSnowStatus,
      });

      console.log("data length", data ? data.length : 0);

      if (error) {
        console.error("Supabase RPC error:", error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      // Transform the data to match the expected format
      const transformedData = (data || []).map((row: any) => {
        const result: any = {
          cote_rue_id: row.cote_rue_id,
          id_trc: row.id_trc,
          id_voie: row.id_voie,
          nom_voie: row.nom_voie,
          nom_ville: row.nom_ville,
          debut_adresse: row.debut_adresse,
          fin_adresse: row.fin_adresse,
          cote: row.cote,
          type_f: row.type_f,
          sens_cir: row.sens_cir,
          street_feature: row.street_feature,
          created_at: row.created_at,
          updated_at: row.updated_at,
        };

        if (includeSnowStatus && row.deneigement_current) {
          result.deneigement_current = row.deneigement_current;
        }

        return result;
      });

      return NextResponse.json(
        {
          success: true,
          data: transformedData,
          count: transformedData.length,
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          },
        }
      );
    }

    // No bounding box - return all streets (original behavior)
    let query = supabase
      .from("streets")
      .select(
        includeSnowStatus
          ? `
        *,
        deneigement_current (
          etat_deneig,
          status,
          date_debut_planif,
          date_fin_planif,
          date_debut_replanif,
          date_fin_replanif,
          date_maj
        )
      `
          : "*"
      )
      .order("nom_voie", { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: data || [],
        count: data?.length || 0,
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
