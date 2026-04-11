import google.generativeai as genai
import os

genai.configure(api_key=os.environ["GEMINI_API_KEY"])

model = genai.GenerativeModel("gemini-2.5-flash")

prompt = """
Write a highly engaging, high-conversion 3-part email drip sequence to retarget old inactive users and bring them to the new Read & Rate platform. 

Context: Read & Rate is a book review platform for self-published authors where they review other books to earn "InkDrops", which they use to get reviews for their own books. 

Goal: Bring old users back, get them excited about the new platform, and push towards our primary goal of 500 organic subscribers. Keep the tone authentic, direct, and non-spammy. Use the exact branding "Read & Rate". 

Base it on 2026 intel: Mailbox providers now use AI to pre-filter, so content MUST be clear, machine-readable and value-driven. No spammy words. Segmenting is key: Address past behavior (why did they leave?) Give genuine value (like an early look at the new platform) rather than just begging them to come back.

Output ONLY the Subject line and Body for Email 1, Email 2, and Email 3. Do not include markdown formatting or intro text.
"""

response = model.generate_content(prompt)
print(response.text)
