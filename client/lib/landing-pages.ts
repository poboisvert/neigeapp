"use client";

import { supabase, getCurrentUser } from "./auth";
import { supabaseAdmin } from "./supabase-admin";
import type { LandingPageData } from "@/components/landing-page-template";

export interface LandingPageRow {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  short_description: string;
  hero_image?: string;
  summary?: string;
  summary_order?: number;
  cta_button: {
    text: string;
    href: string;
    variant?:
      | "default"
      | "destructive"
      | "outline"
      | "secondary"
      | "ghost"
      | "link";
  };
  what_you_get?: any;
  helping_for?: any;
  rich_content?: string;
  rich_content_order?: number;
  pros_and_cons?: any;
  media?: any;
  weather_forecast?: any;
  image_carousel?: any;
  published: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

/**
 * Convert database row to LandingPageData format
 */
export function rowToLandingPageData(row: LandingPageRow): LandingPageData {
  return {
    title: row.title,
    subtitle: row.subtitle,
    shortDescription: row.short_description,
    heroImage: row.hero_image,
    summary: row.summary,
    summaryOrder: row.summary_order,
    ctaButton: row.cta_button,
    whatYouGet: row.what_you_get,
    helpingFor: row.helping_for,
    richContent: row.rich_content,
    richContentOrder: row.rich_content_order,
    prosAndCons: row.pros_and_cons,
    media: row.media,
    weatherForecast: row.weather_forecast,
    imageCarousel: row.image_carousel,
  };
}

/**
 * Convert LandingPageData to database row format
 */
export function landingPageDataToRow(
  data: LandingPageData,
  slug: string,
  id?: string
): Partial<LandingPageRow> {
  return {
    ...(id && { id }),
    slug,
    title: data.title,
    subtitle: data.subtitle,
    short_description: data.shortDescription,
    hero_image: data.heroImage,
    summary: data.summary,
    summary_order: data.summaryOrder,
    cta_button: data.ctaButton,
    what_you_get: data.whatYouGet,
    helping_for: data.helpingFor,
    rich_content: data.richContent,
    rich_content_order: data.richContentOrder,
    pros_and_cons: data.prosAndCons,
    media: data.media,
    weather_forecast: data.weatherForecast,
    image_carousel: data.imageCarousel,
  };
}

/**
 * Get all landing pages (admin - uses service role)
 */
export async function getLandingPages(publishedOnly: boolean = false) {
  let query = supabaseAdmin
    .from("landing_pages")
    .select("*")
    .order("created_at", { ascending: false });

  if (publishedOnly) {
    query = query.eq("published", true);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data as LandingPageRow[];
}

/**
 * Get a landing page by slug (public - uses anon key)
 */
export async function getLandingPageBySlug(slug: string) {
  const { data, error } = await supabase
    .from("landing_pages")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (error) {
    throw error;
  }

  return data as LandingPageRow;
}

/**
 * Get a landing page by ID (admin - uses service role)
 */
export async function getLandingPageById(id: string) {
  const { data, error } = await supabaseAdmin
    .from("landing_pages")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data as LandingPageRow;
}

/**
 * Create a new landing page (admin - uses service role)
 */
export async function createLandingPage(
  slug: string,
  data: LandingPageData,
  published: boolean = false
) {
  // Get user from regular client for user ID
  const user = await getCurrentUser();

  const row = landingPageDataToRow(data, slug);
  row.published = published;
  row.created_by = user?.id;

  // Use admin client for database operations (bypasses RLS)
  const { data: result, error } = await supabaseAdmin
    .from("landing_pages")
    .insert(row)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return result as LandingPageRow;
}

/**
 * Update a landing page (admin - uses service role)
 */
export async function updateLandingPage(
  id: string,
  slug: string,
  data: LandingPageData,
  published?: boolean
) {
  const row = landingPageDataToRow(data, slug, id);
  if (published !== undefined) {
    row.published = published;
  }

  const { data: result, error } = await supabaseAdmin
    .from("landing_pages")
    .update(row)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return result as LandingPageRow;
}

/**
 * Delete a landing page (admin - uses service role)
 */
export async function deleteLandingPage(id: string) {
  const { error } = await supabaseAdmin
    .from("landing_pages")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}
