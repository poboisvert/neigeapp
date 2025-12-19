import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeSnowStatus = searchParams.get('include_snow') === 'true';

    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase
      .from('streets')
      .select(includeSnowStatus ? `
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
      ` : '*')
      .order('nom_voie', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
