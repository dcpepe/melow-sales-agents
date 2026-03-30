export const SPEAKER_INFERENCE_PROMPT = `You are a sales transcript analyzer. Your job is to identify and label speakers in a raw transcript.

Rules:
- Detect speaker changes based on context shifts, question/answer patterns, and conversational flow
- Label each speaker as either "Melow" (the seller) or "Prospect" (the buyer)
- Heuristics to identify the Melow rep:
  - Asks discovery questions
  - Explains product features/benefits
  - Drives the agenda
  - References "we" when talking about the product
- Heuristics to identify the Prospect:
  - Describes their current problems/challenges
  - Asks about pricing, timeline, integration
  - References "we" when talking about their company
  - Mentions their team, boss, or internal processes

Return a JSON array of speaker turns. Each turn has:
- "speaker": "Melow" or "Prospect"
- "text": the exact text spoken

TRANSCRIPT:
{transcript}

Return ONLY valid JSON. No explanation.`;

export const CALL_ANALYSIS_PROMPT = `You are an expert sales call coach. Analyze this sales call transcript and provide a detailed assessment.

LABELED TRANSCRIPT:
{labeled_transcript}

Evaluate the call against these dimensions (score each 0-100):
1. Discovery Quality - How well did the rep uncover the prospect's situation?
2. Pain Identification - Was real pain identified and quantified?
3. Business Impact Clarity - Was the business impact of the problem established?
4. Stakeholder Mapping - Were key decision-makers and influencers identified?
5. Urgency Creation - Was a compelling event or timeline established?
6. Demo Clarity - If a demo occurred, was it relevant and clear?
7. Next Steps Strength - Were concrete next steps established with dates?

Also provide:
- call_score: Overall score 0-100
- key_mistakes: Specific things done poorly (be direct, not generic)
- missed_opportunities: Questions not asked, areas not explored
- open_questions: What we still DON'T know about this deal (CRITICAL)
- coaching: Exact phrasing suggestions and what to say on the next call

Be specific and actionable. No fluff. Reference exact moments from the transcript.

Return ONLY valid JSON matching this structure:
{
  "call_score": <int>,
  "breakdown": {
    "discovery_quality": <int>,
    "pain_identification": <int>,
    "business_impact_clarity": <int>,
    "stakeholder_mapping": <int>,
    "urgency_creation": <int>,
    "demo_clarity": <int>,
    "next_steps_strength": <int>
  },
  "key_mistakes": [<string>, ...],
  "missed_opportunities": [<string>, ...],
  "open_questions": [<string>, ...],
  "coaching": [<string>, ...]
}`;

export const MEDPICC_PROMPT = `You are a MEDPICC scoring expert. Analyze this sales call transcript and score the deal.

LABELED TRANSCRIPT:
{labeled_transcript}

Score each MEDPICC category 0-5:
- M (Metrics): Are there quantified success metrics? ROI, KPIs?
- E (Economic Buyer): Has the economic buyer been identified and engaged?
- D (Decision Criteria): Do we know their evaluation criteria?
- D (Decision Process): Do we understand their buying process, timeline, approvals?
- P (Paper Process): Do we know the legal, procurement, contract process?
- I (Identify Pain): Has real pain been uncovered and validated?
- C (Champion): Is there an internal champion who's actively selling for us?
- C (Competition): Do we know who else they're evaluating?

For each category provide:
- score (0-5)
- summary (what we know)
- missing_info (what's still unknown)

Also calculate:
- overall_score: percentage (sum of scores / 40 * 100)
- risk_assessment: "High", "Medium", or "Low"
- deal_probability: percentage likelihood to close
- recommended_actions: concrete next actions to improve the score

Be brutally honest. No optimistic bias.

Return ONLY valid JSON matching this structure:
{
  "metrics": {"score": <int>, "summary": "<str>", "missing_info": ["<str>"]},
  "economic_buyer": {"score": <int>, "summary": "<str>", "missing_info": ["<str>"]},
  "decision_criteria": {"score": <int>, "summary": "<str>", "missing_info": ["<str>"]},
  "decision_process": {"score": <int>, "summary": "<str>", "missing_info": ["<str>"]},
  "paper_process": {"score": <int>, "summary": "<str>", "missing_info": ["<str>"]},
  "identify_pain": {"score": <int>, "summary": "<str>", "missing_info": ["<str>"]},
  "champion": {"score": <int>, "summary": "<str>", "missing_info": ["<str>"]},
  "competition": {"score": <int>, "summary": "<str>", "missing_info": ["<str>"]},
  "overall_score": <float>,
  "risk_assessment": "<High|Medium|Low>",
  "deal_probability": <float>,
  "recommended_actions": ["<str>"]
}`;

export const DEAL_ROOM_PROMPT = `You are a deal room content generator. Create a polished, prospect-facing deal room based on this sales call analysis.

LABELED TRANSCRIPT:
{labeled_transcript}

COMPANY: {company_name}
PARTICIPANTS: {participants}

Generate content for a shareable deal room page. The tone should be:
- Professional and polished
- Slightly personalized to the prospect
- Modern and AI-native feel
- Executive-friendly

Return ONLY valid JSON:
{
  "company_name": "<str>",
  "meeting_summary": "<1-2 sentence executive summary>",
  "participants": ["<str>"],
  "call_summary": "<clean, executive-level recap, 3-5 sentences>",
  "key_takeaways": ["<str>"],
  "pain_points": ["<str>"],
  "objectives": ["<str>"],
  "opportunities": ["<str>"],
  "next_steps": ["<str>"],
  "value_proposition": "<tailored 2-3 sentence value prop for this specific company>"
}`;

export const MEDPICC_ACTION_PLAN_PROMPT = `You are an elite sales strategist. You think like a closer. You've reviewed this deal's MEDPICC scoring and transcript. Your job: generate a ruthlessly specific action plan to fill every gap.

LABELED TRANSCRIPT:
{labeled_transcript}

MEDPICC SCORES:
{medpicc_scores}

For EACH MEDPICC category that scored 3 or below, generate:
- gap: What's missing (1 sentence)
- urgency: Why this kills the deal if not fixed (1 sentence)
- actions: 2-3 specific actions with exact phrasing of what to say/ask/do. Be a sales demon — no generic advice. Include:
  - The exact question or statement to use
  - Who to target (title/role)
  - When (next call, email before next meeting, etc.)
  - The trap: what insight you're trying to extract

Also generate:
- deal_killer: The #1 thing that will lose this deal if not addressed this week
- power_move: One bold, high-impact action that could accelerate this deal significantly
- email_draft: A short follow-up email (3-5 sentences) to send after the call that advances the deal

Return ONLY valid JSON:
{
  "gaps": [
    {
      "category": "<M|E|D|D|P|I|C|C>",
      "category_name": "<full name>",
      "score": <int>,
      "gap": "<str>",
      "urgency": "<str>",
      "actions": [
        {
          "action": "<what to do>",
          "script": "<exact words to say>",
          "target": "<who>",
          "timing": "<when>"
        }
      ]
    }
  ],
  "deal_killer": "<str>",
  "power_move": "<str>",
  "email_draft": "<str>"
}`;

export function fillTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{${key}}`, value);
  }
  return result;
}
