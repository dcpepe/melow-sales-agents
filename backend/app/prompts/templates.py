SPEAKER_INFERENCE_PROMPT = """You are a sales transcript analyzer. Your job is to identify and label speakers in a raw transcript.

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

Return ONLY valid JSON. No explanation."""

CALL_ANALYSIS_PROMPT = """You are an expert sales call coach. Analyze this sales call transcript and provide a detailed assessment.

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
{{
  "call_score": <int>,
  "breakdown": {{
    "discovery_quality": <int>,
    "pain_identification": <int>,
    "business_impact_clarity": <int>,
    "stakeholder_mapping": <int>,
    "urgency_creation": <int>,
    "demo_clarity": <int>,
    "next_steps_strength": <int>
  }},
  "key_mistakes": [<string>, ...],
  "missed_opportunities": [<string>, ...],
  "open_questions": [<string>, ...],
  "coaching": [<string>, ...]
}}"""

MEDPICC_PROMPT = """You are a MEDPICC scoring expert. Analyze this sales call transcript and score the deal.

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
{{
  "metrics": {{"score": <int>, "summary": "<str>", "missing_info": ["<str>"]}},
  "economic_buyer": {{"score": <int>, "summary": "<str>", "missing_info": ["<str>"]}},
  "decision_criteria": {{"score": <int>, "summary": "<str>", "missing_info": ["<str>"]}},
  "decision_process": {{"score": <int>, "summary": "<str>", "missing_info": ["<str>"]}},
  "paper_process": {{"score": <int>, "summary": "<str>", "missing_info": ["<str>"]}},
  "identify_pain": {{"score": <int>, "summary": "<str>", "missing_info": ["<str>"]}},
  "champion": {{"score": <int>, "summary": "<str>", "missing_info": ["<str>"]}},
  "competition": {{"score": <int>, "summary": "<str>", "missing_info": ["<str>"]}},
  "overall_score": <float>,
  "risk_assessment": "<High|Medium|Low>",
  "deal_probability": <float>,
  "recommended_actions": ["<str>"]
}}"""

DEAL_ROOM_PROMPT = """You are a deal room content generator. Create a polished, prospect-facing deal room based on this sales call analysis.

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
{{
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
}}"""
