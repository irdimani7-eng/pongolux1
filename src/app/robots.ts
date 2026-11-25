import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// AI crawlers that scrape sites specifically to train language models or to
// power a live "answer engine" — separate from ordinary search crawlers
// like Googlebot/Bingbot, which stay allowed under the "*" rule below since
// blocking those would hurt the site's actual findability on Google/Bing.
// A robots.txt rule is a request, not a lock: a well-behaved crawler reads
// and honors it (every bot on this list documents that it does), but
// nothing stops a scraper that ignores robots.txt outright — this closes
// the "polite" path, not every path. Worth revisiting this list periodically,
// since new AI crawlers show up regularly and none of these are guaranteed
// to still use the same name forever.
const AI_CRAWLER_USER_AGENTS = [
  "GPTBot", // OpenAI's training crawler
  "ChatGPT-User", // OpenAI, fetches pages live in response to a ChatGPT user's request
  "OAI-SearchBot", // OpenAI's search/answer crawler
  "ClaudeBot", // Anthropic's training crawler
  "Claude-Web", // Anthropic, live fetches for Claude
  "anthropic-ai", // Anthropic, older crawler name
  "CCBot", // Common Crawl — its dataset is a major source for training many companies' models
  "Google-Extended", // opts out of Google's AI training/Gemini use specifically; Googlebot itself (search) is unaffected and stays allowed
  "Applebot-Extended", // opts out of Apple's AI training use; Applebot itself (Siri/Spotlight search) stays allowed
  "Bytespider", // ByteDance/TikTok's crawler
  "PerplexityBot", // Perplexity AI's search/answer crawler
  "Meta-ExternalAgent", // Meta's AI training crawler
  "Amazonbot", // Amazon's crawler (used for Alexa/AI features, beyond plain search)
  "Diffbot",
  "cohere-ai",
  "YouBot",
] as const;

const OPENAI_FEED_FETCHERS: readonly string[] = ["ChatGPT-User", "OAI-SearchBot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // The blanket "/api/" disallow below is meant for internal/auth/
        // webhook routes, not this one — the Merchant Center feed has to be
        // fetchable by Google's crawler for scheduled-fetch to work at all.
        // A longer, more specific "Allow" always wins over a shorter
        // "Disallow" on the same path per the robots.txt spec, regardless of
        // the order they're listed in.
        allow: ["/", "/api/merchant-feed", "/api/chatgpt-feed"],
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/account",
          "/cart",
          "/checkout",
          "/login",
          "/signup",
        ],
      },
      // Every AI crawler above gets its own blanket disallow, entirely
      // separate from the "*" rule above — so this can never accidentally
      // loosen (or need to duplicate) the real-search-engine rules.
      // Exception: OpenAI's fetchers may read the ChatGPT product feed (and
      // nothing else), so the hosted-URL feed in ChatGPT's merchant setup can
      // refresh stock. GPTBot (training) is not given this exception.
      ...AI_CRAWLER_USER_AGENTS.map((userAgent) =>
        OPENAI_FEED_FETCHERS.includes(userAgent)
          ? { userAgent, allow: "/api/chatgpt-feed", disallow: "/" }
          : { userAgent, disallow: "/" }
      ),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
