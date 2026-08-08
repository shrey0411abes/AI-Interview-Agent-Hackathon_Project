\# Antigravity Prompt — Critical Fixes + Advanced UI/UX Phase



The multi-page app is live and working — Home, Dashboard, Interview, and Results all function correctly, and Gemini is generating genuinely adaptive, scenario-based questions. This phase has two parts: fix three real correctness bugs on the Results page first, then push the UI/UX further with advanced features.



\---



\## PROMPT — PART 1: Critical bug fixes (do this first, before any new features)



I tested the results page with a candidate who gave deliberately weak/non-answers throughout an 8-question interview. Three bugs surfaced that must be fixed before any visual enhancement work:



\*\*Bug 1 — Verdict badge contradicts the evaluation summary.\*\*

The results page showed "HIRE RECOMMENDED" while the executive summary explicitly stated the candidate "did not demonstrate technical competency" and gave "non-substantive responses to all questions." Find where the verdict badge (Hire Recommended / Needs Improvement / etc.) is determined — it must be derived from the actual feedback content (e.g., a computed score threshold, or an explicit verdict field the LLM is asked to output alongside summary/strengths/gaps/next), not hardcoded or defaulted to a positive value. Update the feedback generation prompt to explicitly require a verdict field with clear criteria (e.g., "STRONG\_HIRE", "HIRE", "BORDERLINE", "NO\_HIRE" based on genuine performance across probed topics), and wire the badge to render based on that real field.



\*\*Bug 2 — "Demonstrated Strengths" card renders empty with no fallback.\*\*

When a candidate has no genuine strengths to report (as in this weak-answer test case), the card shows a header with completely blank content — no text, no empty-state message. Fix this so that when the strengths array is empty, the UI shows a clear, honest message like "No significant strengths demonstrated in this session" instead of blank space. This applies to any other card that could plausibly render empty (gaps, next-steps) — audit all of them for the same issue.



\*\*Bug 3 — Radar chart doesn't reflect the qualitative assessment.\*\*

The domain mastery radar chart showed moderate values across all axes despite the executive summary and gaps section describing near-total lack of competency across those same topics. Find where the per-topic scores feeding the radar chart are computed — if they're hardcoded, defaulted, or estimated independently of the actual LLM evaluation, fix this so the chart is generated FROM the same evaluation that produces the summary/strengths/gaps text, not a separate or placeholder calculation. The chart and the text must tell the same story.



After fixing all three, re-test with a deliberately weak interview (short/dismissive answers) and confirm: the verdict is appropriately negative, the strengths card shows an honest empty state, and the radar chart shows low values matching the gaps described. Then test with a deliberately strong/detailed interview and confirm the opposite holds — positive verdict, populated strengths, high radar values. Show me both test results before moving to Part 2.



\---



\## PROMPT — PART 2: Advanced UI/UX features (after Part 1 is verified fixed)



The foundation (glassmorphism, light/dark, 4-page routing) is solid. Now add features that push this beyond a typical hackathon UI into something that feels like a considered product.



\### Micro-interactions and motion polish

\- \*\*Animated number count-ups\*\* on dashboard stat cards and results page metrics (e.g., "0 → 8 questions" counting up on load, not appearing instantly) using Framer Motion's `useMotionValue`/`animate`.

\- \*\*Skeleton loading states\*\* for the dashboard candidate cards and results page while data is being computed — not a blank screen or spinner, actual content-shaped placeholders that shimmer.

\- \*\*Toast notifications\*\* for key events (interview started, session completed, error states) — a small glass-styled toast component sliding in from a corner, auto-dismissing.

\- \*\*Hover depth effects\*\* on cards — subtle scale + shadow lift on candidate cards and result cards (transform: translateY + increased shadow blur on hover), reinforcing the glass/depth theme.



\### Results page enhancements

\- \*\*Expandable Q\&A timeline\*\* — for each probed curriculum day, an accordion showing the actual question asked and the candidate's actual answer, so a judge can review the full transcript without leaving the results page.

\- \*\*Confidence/performance indicator per topic\*\* — small inline badges (not just the radar chart) next to each probed day showing strong/moderate/weak at a glance.

\- \*\*Print-friendly / export view\*\* — a "Download Report" button that at minimum opens a clean, print-optimized version of the results page (`window.print()` with print-specific CSS is enough — full PDF generation is optional if time allows).

\- \*\*Comparison mode\*\* (if time allows) — ability to view two completed sessions side-by-side on the results page for comparing candidates.



\### Dashboard enhancements

\- \*\*Sort and filter controls\*\* — sort candidates by mission completion %, experience, or 1st-try rate; filter by role.

\- \*\*Session history panel\*\* — if multiple interviews have been run in the current browser session, show a small recent-sessions list (in-memory only, consistent with the earlier constraint) linking back to their results pages.

\- \*\*Animated stat banner\*\* — the quick-stats row (candidates/sessions/avg time/questions) should animate in with a staggered reveal on page load.



\### Accessibility and polish pass

\- Keyboard navigation: full tab-order support through candidate cards, chat input, and results page actions.

\- Focus-visible states styled to match the glass/gradient design system (not default browser blue outline, but still clearly visible).

\- ARIA labels on icon-only buttons (theme toggle, back buttons, send button).

\- Confirm color contrast passes WCAG AA in both light and dark themes, especially for text over glass/blurred backgrounds.



\### One standout feature — pick one to implement well rather than several half-done

Choose ONE of the following to implement as a genuine differentiator, rather than spreading effort thin:

\- \*\*Live typing/thinking visualization\*\* — show a more sophisticated "AI Interviewer is thinking" state that varies its message based on what it's doing (e.g., "Analyzing your response...", "Selecting next topic...", "Grounding in curriculum...") rather than a static dots animation — this also doubles as transparency into the LangGraph state machine's actual steps.

\- \*\*Interactive curriculum map\*\* — a visual graph/network view of all 31 curriculum days, with probed days highlighted, that a judge can explore on the results page to understand the full scope of what wasn't asked.

\- \*\*Session replay mode\*\* — a "replay" button on the results page that re-plays the interview conversation with the original streaming pacing, like watching a recording.



\### Constraints

\- Do not modify backend logic beyond what's needed for Bug 1 and Bug 3 (verdict field, score computation) — those two require a backend feedback-generation change; everything else in Part 2 is frontend-only.

\- Test every new feature in both light and dark mode before considering it done.

\- Commit after Part 1 (bug fixes) separately from Part 2 (features), and commit each major feature within Part 2 separately — don't bundle everything into one giant commit.



Start with Part 1. Show me the fix and both test results (weak interview, strong interview) before I approve moving to Part 2.



