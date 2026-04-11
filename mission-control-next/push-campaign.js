const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const campaignText = `### Email 1: The "We Listened" Value Drop
**Subject:** Remember [User's Name]? We've Evolved!

Hey [User's Name],

It's been a while, hasn't it? We know you were once part of our community, and we genuinely missed having you around. Whether life got busy, or our platform just wasn't quite what you needed back then, we understand.

But things have changed. A lot.

We've listened to every piece of feedback, every wish, and every frustration. And we've built something entirely new, something designed specifically for self-published authors like you: **Read & Rate**.

Imagine a place where your unique voice as an author is not just heard, but celebrated. A place where getting genuine, constructive reviews for your hard work isn't a struggle, but a seamless, rewarding experience. That's Read & Rate.

Here's a glimpse of what's waiting for you:
*   **Earn "InkDrops" by reviewing others:** Read and review books from fellow authors, and for every thoughtful review, you earn our unique currency.
*   **Spend "InkDrops" to get reviews for YOUR books:** Use your earned InkDrops to commission reviews for your own titles, ensuring they get the visibility and feedback they deserve.
*   **A focused community:** Connect with authors who truly understand the journey of self-publishing.

This isn't just an update; it's a complete reimagining based on what authors truly need. We're launching soon, and we believe Read & Rate will be a game-changer for your author career.

Want a sneak peek at the new platform and how it works? We've prepared a quick, no-nonsense walkthrough video that cuts straight to the value.

*[Link to a short, engaging video demo of Read & Rate]*

We'd love to welcome you back to a community that's now more aligned with your goals than ever before. No pressure, just an invitation to see what we've been building.

Curious to learn more and see if Read & Rate is the right fit for you now?

**[Button: Explore Read & Rate Now]**

Warmly,
The Read & Rate Team

***

### Email 2: The "Early Access" Hook
**Subject:** Your Author Journey, Supercharged (Early Access)

Hey [User's Name],

Following up on our last message – we hope you had a chance to check out the intro to our new platform, **Read & Rate**. We're genuinely excited about what we've built, and we believe it solves a core challenge for self-published authors: getting quality reviews.

We know your time is precious, so let's get straight to the point. We understand that in the past, perhaps our platform didn't fully meet your needs, or maybe it felt like another task on a long list. We've taken those learnings to heart.

With Read & Rate, our entire system is designed around a simple, powerful exchange: **review to earn, earn to get reviewed.** No complex algorithms, no endless begging, just a focused, author-centric ecosystem.

We're approaching our official launch, and as a former member of our community, we're extending a special invitation for **early access to Read & Rate**. This isn't just about coming back; it's about being among the first to experience a platform built from the ground up to support your success.

Why join for early access?
*   **Be a founding member:** Help shape the community and platform during its crucial early stages.
*   **Accumulate InkDrops early:** Start reviewing and earning InkDrops *before* the general public, positioning you perfectly to get reviews for your own books immediately upon full launch.
*   **Direct line to our team:** Your feedback during this phase will be invaluable and directly influence future features.

We're aiming for 500 organic subscribers to build a vibrant, active community, and we truly believe you could be a key part of that. This is a chance to get in early, understand the mechanics, and start leveraging the system to your advantage.

Ready to see how straightforward and rewarding Read & Rate truly is?

**[Button: Claim Your Early Access Spot]**

We're confident that once you experience the new Read & Rate, you'll see how valuable it can be for your author career. This isn't just about reviews; it's about building a sustainable, supportive path to author visibility.

See you on the inside,
The Read & Rate Team

***

### Email 3: The "Final FOMO" Nudge
**Subject:** Final Call: Don't Miss Out on Read & Rate's Launch!

Hey [User's Name],

This is our last friendly nudge before the full launch of **Read & Rate** – the dedicated book review platform designed by authors, for authors.

We've shared the vision, offered you a sneak peek, and even extended an early access invitation. We understand if you're still weighing your options or if past experiences have made you hesitant. We respect that.

However, if getting genuine, constructive reviews for your self-published books has ever been a challenge, and if you believe in the power of a reciprocal community, then Read & Rate is genuinely worth another look.

**Our core promise:** You review books from fellow authors, earn "InkDrops," and then use those InkDrops to secure reviews for your own books. It's a clear, transparent, and rewarding system built to drive author success.

We're almost at our goal of 500 organic subscribers, and every author who joins brings us closer to creating the most dynamic and supportive review exchange platform out there. Your participation matters.

Think about the impact that a steady stream of authentic reviews could have on your book sales, your author reputation, and your overall confidence. Read & Rate is designed to make that a reality.

This is your final opportunity to join our early adopters and begin leveraging Read & Rate before the general public rush. Don't let this chance to supercharge your author journey pass you by.

Ready to take control of your book's visibility?

**[Button: Join Read & Rate Before Launch]**

We truly believe in the community we're building and the value Read & Rate brings to every self-published author. We hope to see you there.

Best regards,
The Read & Rate Team`;

async function push() {
  const { data, error } = await supabase.from('intel').insert([{
    title: 'Win-Back Campaign: Old User Retargeting (2026)',
    category: 'Marketing Campaign',
    summary: campaignText,
    importance: 'high',
    source: 'Aura/Joe (GenAI 2.5 Flash)',
    date: new Date().toISOString()
  }]);
  console.log("Error:", error);
  console.log("Data:", data);
}
push();
