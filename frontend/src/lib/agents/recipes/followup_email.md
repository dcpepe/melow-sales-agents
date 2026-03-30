# Follow-Up Email

## Inputs
- deal: Deal object
- latest_call: Most recent call analysis + transcript
- contacts: Participant information

## Instructions
Write a follow-up email to send after the latest call. The email should:

1. Reference specific points discussed (not generic)
2. Confirm any agreed next steps
3. Include 2-3 qualifying questions to advance the deal
4. Reference a relevant case study or proof point if applicable
5. Keep it under 150 words — busy executives won't read more

Tone: professional, warm, specific. Not salesy.

## Output Format
Return JSON:
```json
{
  "subject": "email subject line",
  "body": "the email body",
  "to": "recipient description",
  "why_this_works": "1-2 sentences explaining the strategy"
}
```
