import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; // Use anon for simple insert or service if available

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const posts = [
  { channel_id: 1, post_date: '2026-03-12', title: "Amazon KDP's silent print royalty cut for books under $9.99...", content: "Since the royalty shift from 60% down to 50% for print books priced under $9.99 (for standard trim sizes), I've noticed a lot of panic in the low/no-content space. Are you raising your prices to $9.99 or absorbing the hit?", status: 'pending' },
  { channel_id: 1, post_date: '2026-03-13', title: "The move to DRM-free EPUB/PDF downloads on Kindle: Are you enabling it?", content: "In January, Amazon quietly started letting readers download DRM-free EPUBs and PDFs of Kindle books. This is a huge shift for accessibility. Have you seen any impact on sales or piracy concerns yet?", status: 'pending' },
  { channel_id: 1, post_date: '2026-03-14', title: "KDP now mandates alt text for all eBook images.", content: "Amazon is getting strict about accessibility. Every single image now needs alt text. It's more work, but it might help with ranking if the AI can finally \"see\" our diagrams and maps.", status: 'pending' },
  { channel_id: 1, post_date: '2026-03-15', title: "Generative Engine Optimization (GEO) is the new SEO for authors.", content: "People aren't just searching Google for book recommendations anymore; they are asking Perplexity and ChatGPT. How do we make sure our author name pops up in their recommendations?", status: 'pending' },
  { channel_id: 1, post_date: '2026-03-16', title: "Direct-to-Reader sales via Shopify vs. KDP Exclusivity.", content: "With indie authors earning 70-90% on Shopify compared to KDP's cut, the math is starting to look very attractive. But can you survive without the Kindle Unlimited reach?", status: 'pending' },
  { channel_id: 1, post_date: '2026-03-17', title: "Is Amazon Ads getting more volatile or is it just me?", content: "The bid wars for keywords are insane right now. I've seen my ACOS double this week. Anyone else noticing a shift in the AI-driven bidding system lately?", status: 'pending' },
  { channel_id: 1, post_date: '2026-03-18', title: "The Rise of Human Curators in an AI World.", content: "Despite AI recommendations, readers still trust people. How are you building relationships with indie curators this year instead of just fighting the Amazon algorithm?", status: 'pending' },
  { channel_id: 2, post_date: '2026-03-12', title: "Is the 'Typography-Only' book cover trend finally dying in 2026?", content: "For the last two years, minimalist covers with massive, stylized text dominated. But I'm seeing a shift back to conceptual illustration. What's on your current TBR list? Bold text or beautiful art?", status: 'pending' },
  { channel_id: 2, post_date: '2026-03-13', title: "Keyword stuffing in titles/subtitles is dead.", content: "Amazon's A9 algorithm has been vicious lately toward books with \"stuffed\" subtitles. It seems they want clean, short titles and organic engagement now. A win for quality?", status: 'pending' },
  { channel_id: 2, post_date: '2026-03-14', title: "Bold Shapes and Grids: The 2026 Aesthetic for Mystery/Thriller covers.", content: "I've noticed a ton of high-contrast, geometric designs on the bestseller lists this month. It organize the layout and guides the eye. Do you prefer this to the old moody photography?", status: 'pending' },
  { channel_id: 2, post_date: '2026-03-15', title: "Handcrafted and Painterly styles: A reaction to the AI-generated flood?", content: "Visible brushstrokes and textured digital paintings are making a huge comeback. It feels more human. Are you seeing this in your favorite genres?", status: 'pending' },
  { channel_id: 2, post_date: '2026-03-16', title: "Dual Visibility: Designing covers for both Thumbnail and Print sizes.", content: "A cover needs to pop as a 100px thumbnail on a phone screen AND look professional in print. Bold structure vs subtle detail—what's your favorite cover this month?", status: 'pending' },
  { channel_id: 2, post_date: '2026-03-17', title: "High-Contrast Neon and Explosive Colors are taking over Contemporary Fiction.", content: "Muted palettes are out. Saturated, high-contrast neons are everywhere in 2026. Does it make you more likely to click, or is it too much?", status: 'pending' },
  { channel_id: 2, post_date: '2026-03-18', title: "Is graphic minimalism in adult fiction getting too repetitive?", content: "Every second book in the bookstore looks like a vector illustration right now. Are we reaching peak minimalism, or is there still room for this style to evolve?", status: 'pending' }
];

async function seed() {
  console.log("Seeding Digg posts...");
  const { data, error } = await supabase
    .from('digg_posts')
    .insert(posts);

  if (error) {
    console.error("Error seeding posts:", error);
  } else {
    console.log("Success! Posts seeded.");
  }
}

seed();
