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
 * Convert database row to LandingPageData format (server-side)
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
