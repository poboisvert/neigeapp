import { LandingPageTemplate } from "@/components/landing-page-template";
import { notFound } from "next/navigation";
import { createSimpleClient } from "@/lib/supabase-server";
import { rowToLandingPageData } from "@/lib/landing-pages-server";

interface LandingPageProps {
  params: {
    slug: string;
  };
}

export default async function DynamicLandingPage({ params }: LandingPageProps) {
  const supabase = createSimpleClient();

  // Fetch landing page from Supabase
  const { data: page, error } = await supabase
    .from("landing_pages")
    .select("*")
    .eq("slug", params.slug)
    .eq("published", true)
    .single();

  if (error || !page) {
    notFound();
  }

  // Convert database row to LandingPageData format
  const pageData = rowToLandingPageData(page);

  return <LandingPageTemplate {...pageData} />;
}

// Generate static params for published landing pages (optional, for static generation)
export async function generateStaticParams() {
  const supabase = createSimpleClient();

  const { data: pages } = await supabase
    .from("landing_pages")
    .select("slug")
    .eq("published", true);

  if (!pages || pages.length === 0) {
    return [];
  }

  return pages.map((page) => ({
    slug: page.slug,
  }));
}
