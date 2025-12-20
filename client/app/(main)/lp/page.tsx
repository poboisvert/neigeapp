import {
  LandingPageTemplate,
  LandingPageData,
} from "@/components/landing-page-template";
import { Snowflake, Bell, Map, Calendar } from "lucide-react";

// Example landing page data
// You can control the order of sections using the order properties:
// - summaryOrder: order for summary section (default: 1)
// - whatYouGet.order: order for "What You Get" section (default: 2)
// - helpingFor.order: order for "Helping For" section (default: 3)
// - richContentOrder: order for rich content section (default: 4)
// - prosAndCons.order: order for pros/cons section (default: 5)
// - media.order: order for media section (default: 6)
// Lower numbers appear first. Sections are sorted in ascending order.
const landingPageData: LandingPageData = {
  title: "Welcome to Info-Neige Montreal",
  subtitle: "Your Complete Snow Removal Information Hub",
  shortDescription:
    "Stay informed about snow removal operations across Montreal. Get real-time updates, alerts, and comprehensive street coverage information.",
  heroImage:
    "https://plus.unsplash.com/premium_photo-1698846875880-e2fecb1b4234?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",

  // Optional: Use weatherForecast instead of summary
  // summary:
  //   "Info-Neige Montreal provides comprehensive snow removal information for all Montreal residents. Our platform offers real-time updates, street-by-street coverage, and personalized alerts to help you stay informed during winter months.",
  // summaryOrder: 1, // Summary appears first (after header)

  // Weather Forecast Section (can replace summary)
  weatherForecast: {
    title: "Weather Forecast",
    description:
      "Stay ahead with upcoming weather conditions that may affect snow removal operations.",
    order: 1,
    forecasts: [
      {
        date: "Today",
        snow: {
          amount: "5-10 cm",
          probability: 80,
        },
        rain: {
          amount: "2-5 mm",
          probability: 30,
        },
        temperature: {
          high: -5,
          low: -12,
          unit: "C",
        },
      },
    ],
  },

  ctaButton: {
    text: "Get Started Now",
    href: "/app",
    variant: "default",
  },

  whatYouGet: {
    title: "What You Get",
    description: "Info-Neige Montreal serves various groups across the city.",
    order: 2, // Appears second
    items: [
      {
        title: "Real-Time Updates",
        description:
          "Get instant notifications about snow removal operations in your area.",
        icon: <Bell className='h-8 w-8' />,
      },
      {
        title: "Street Coverage",
        description: "Comprehensive information about all streets in Montreal.",
        icon: <Map className='h-8 w-8' />,
      },
      {
        title: "Schedule Information",
        description:
          "Know exactly when snow removal will happen on your street.",
        icon: <Calendar className='h-8 w-8' />,
      },
      {
        title: "Weather Alerts",
        description:
          "Stay ahead with weather forecasts and snow removal predictions.",
        icon: <Snowflake className='h-8 w-8' />,
      },
    ],
  },

  helpingFor: {
    title: "Who We're Helping",
    description: "Info-Neige Montreal serves various groups across the city.",
    items: [
      {
        title: "Residents",
        description:
          "Homeowners and renters who need to know when to move their cars and prepare for snow removal.",
      },
      {
        title: "Businesses",
        description:
          "Local businesses that need to plan operations around snow removal schedules.",
      },
      {
        title: "City Workers",
        description:
          "Municipal workers who coordinate and execute snow removal operations.",
      },
      {
        title: "Visitors",
        description:
          "Tourists and visitors who need to navigate the city during winter months.",
      },
    ],
  },

  richContent: `
    <h2>About Our Service</h2>
    <p>
      Info-Neige Montreal is a comprehensive platform designed to keep Montreal residents 
      informed about snow removal operations throughout the winter season. Our service 
      combines <strong>real-time data</strong> with <em>user-friendly interfaces</em> to 
      provide the most accurate and up-to-date information.
    </p>
    <p>
      We understand that snow removal affects daily life in Montreal, from parking 
      restrictions to travel planning. That's why we've built a platform that makes 
      this information easily accessible to everyone.
    </p>
    <h3>Key Features</h3>
    <ul>
      <li>Real-time snow removal status updates</li>
      <li>Street-by-street coverage information</li>
      <li>Personalized alerts and notifications</li>
      <li>Interactive maps showing current operations</li>
      <li>Historical data and trends</li>
    </ul>
    <p>
      Our platform is <span style="color: #3b82f6;">continuously updated</span> to 
      ensure you always have the latest information. We work closely with municipal 
      authorities to provide accurate and timely data.
    </p>
  `,
  richContentOrder: 4, // Appears fourth

  prosAndCons: {
    title: "Pros and Cons",
    pros: [
      "Free access to all basic features",
      "Real-time updates and notifications",
      "Comprehensive street coverage",
      "User-friendly interface",
      "Mobile-responsive design",
      "Available in multiple languages",
    ],
    cons: [
      "Requires internet connection",
      "Data depends on municipal updates",
      "Some advanced features may require account",
      "Notifications may be frequent during heavy snow periods",
    ],
  },

  // Media Section - YouTube video
  // Supports various YouTube URL formats:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  media: {
    title: "See It In Action",
    description:
      "Watch how Info-Neige Montreal helps you stay informed during winter months.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Replace with your actual YouTube video URL
    order: 4, // Appears after "Helping For" section
  },

  // Image Carousel Section
  imageCarousel: {
    title: "Gallery",
    description:
      "Explore Montreal's winter scenes and snow removal operations.",
    order: 3,
    images: [
      {
        url: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&q=80",
        alt: "Winter mountain scene",
        caption: "Montreal winter landscape",
      },
      {
        url: "https://images.unsplash.com/photo-1551524164-6cf77f5e1d65?w=800&q=80",
        alt: "Snow covered street",
        caption: "Snow removal in progress",
      },
      {
        url: "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=800&q=80",
        alt: "Winter cityscape",
        caption: "Montreal in winter",
      },
      {
        url: "https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=800&q=80",
        alt: "Snow plow",
        caption: "Snow removal equipment",
      },
    ],
  },
};

export default function LandingPage() {
  return <LandingPageTemplate {...landingPageData} />;
}
