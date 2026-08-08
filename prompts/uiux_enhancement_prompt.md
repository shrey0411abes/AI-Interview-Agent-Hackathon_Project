\# Antigravity Build Prompt — UI/UX Enhancement Phase (Multi-Page, Glassmorphism, Light/Dark)



The backend and core interview flow are working and verified. This prompt upgrades the frontend into a multi-page, visually distinctive product that stands out from typical hackathon submissions.



\---



\## PROMPT



You are a senior product designer and frontend engineer. The AI Interview Agent's core functionality (backend, state machine, LLM integration) is complete and working. Now upgrade the frontend into a polished, multi-page, visually distinctive application. Judges have seen dozens of generic dark-chat-bubble hackathon UIs — this needs to look and feel like a funded startup's product, not a weekend prototype.



Plan the page architecture and design system first, show me the plan, then implement page by page.



\### New page architecture — add React Router

Currently everything lives on one screen. Restructure into distinct routes:



```

/                    → Landing/Home page (marketing-style intro, not the interview itself)

/dashboard           → Candidate selection + interview overview dashboard

/interview/:sessionId → The live interview chat (existing functionality, restyled)

/results/:sessionId  → Dedicated full-page interview summary/report (separate from the sidebar mini-dashboard)

```



Use `react-router-dom`. Preserve all existing interview logic — this is a restructuring and visual upgrade, not a rewrite of the state machine or API calls.



\### Global design system — implement first, before touching individual pages



\*\*Glassmorphism as the core visual language:\*\*

\- Frosted-glass panels: `backdrop-filter: blur(16px)`, semi-transparent backgrounds (`rgba` with 0.6-0.8 alpha depending on theme), subtle 1px border with low-opacity white/black depending on mode, soft layered shadows.

\- Layer depth intentionally: background gradient mesh or animated blobs behind glass panels so the blur effect is actually visible and not just a flat semi-transparent box.

\- Avoid overusing it — glass panels for cards, sidebars, and modals; not for every single element, or it becomes visual noise instead of a signature.



\*\*Color system — move beyond a single dark purple palette:\*\*

\- Define a proper design token set: primary, secondary, accent, success, warning, danger, and neutral scales (50-900) for both light and dark themes.

\- Use a distinctive accent gradient (not just solid purple) — e.g., a signature gradient combining two complementary colors used consistently across CTAs, progress bars, and active states, so it becomes a recognizable visual identity.

\- Ensure sufficient contrast in both themes — glassmorphism can hurt readability if not tuned carefully; test text legibility over blurred backgrounds in both modes.



\*\*Light/Dark mode:\*\*

\- Implement a real theme toggle (not just a CSS class swap) using a Zustand slice or React Context, persisted to `localStorage`... wait, no — per project constraints, browser storage besides in-memory state isn't reliable across contexts here; persist via React state only, defaulting to system preference on load (`prefers-color-scheme`).

\- Toggle button should be reachable from every page (likely in a persistent top nav or sidebar), with a smooth animated transition between themes (200-300ms), not an instant jarring flip.

\- Both themes need their own tuned glassmorphism values — light mode glass looks and behaves differently than dark mode glass (lighter blur backgrounds, darker borders).



\*\*Typography and spacing:\*\*

\- Pick a distinctive font pairing (e.g., a geometric sans for headings, a clean readable sans for body) via Google Fonts or a bundled variable font — avoid the default system font stack, it reads as unstyled.

\- Consistent spacing scale (4/8/12/16/24/32/48px) applied throughout — no ad hoc margins.



\### Page-by-page requirements



\*\*1. Landing/Home page (`/`)\*\*

\- Strong hero section: headline, subheadline, animated visual element (could be an abstract animated gradient mesh, a subtle particle effect, or an animated illustration of the interview concept — tasteful motion, not distracting).

\- Clear value proposition: what this platform does, in plain language, before any product UI is shown.

\- A prominent CTA button ("Start Assessment" / "Try a Demo Interview") leading to `/dashboard`.

\- A brief "How it works" section (3-4 steps, icon + short text each) explaining the adaptive interview concept.

\- Trust/credibility band: badges or small cards showing the tech stack (Chroma RAG, LangGraph, Gemini) — this doubles as technical credibility signaling for judges.

\- Footer with minimal links.



\*\*2. Dashboard (`/dashboard`)\*\*

\- Candidate selection presented as visually rich cards (not a plain dropdown) — photo/avatar placeholder, name, role, mission completion percentage as a small radial progress indicator, key stats at a glance.

\- A sidebar (glassmorphic, collapsible) for navigation between Home, Dashboard, and past session results if any exist in the current session's memory.

\- Quick-stats banner at the top: total curriculum days, days probed for the selected candidate, sessions completed this browser session, etc. — glass cards in a row.

\- Prominent "Begin Interview" button that transitions into `/interview/:sessionId`, generating a new session ID.

\- Smooth page-load animations (staggered card fade/slide-in via Framer Motion) so the dashboard feels alive on arrival, not static.



\*\*3. Interview page (`/interview/:sessionId`)\*\*

\- Keep all existing functionality (chat, streaming, progress sidebar) — restyle to match the new glassmorphic design system and add the theme toggle to the header.

\- Add a subtle animated background (soft gradient motion) behind the glass chat panel so the interview screen doesn't feel visually flat compared to the new dashboard/home pages.

\- On completion (`done: true`), auto-navigate to `/results/:sessionId` instead of showing the dashboard inline as before — this makes the results page a real, shareable, revisitable destination.



\*\*4. Results page (`/results/:sessionId`) — new dedicated page, not a sidebar panel\*\*

\- Full-page report layout, distinct from the compact in-sidebar version currently used.

\- Hero section at top: overall readiness verdict (Hire Recommended / Needs Improvement / etc.), candidate name/role, large and visually prominent.

\- Radar/spider chart (Recharts, already in stack) for domain mastery — larger and more detailed than the current sidebar version.

\- Strengths, gaps, and next-steps as distinct glass cards with icons, not plain bullet lists.

\- A visual timeline or stepper showing all curriculum days probed, in order, each expandable to show the actual Q\&A exchange for that day (accordion or modal).

\- A "Download Report" or "Share Results" button (can be a no-op/placeholder for now if actual PDF export isn't in scope, but include the UI affordance).

\- A "New Assessment" CTA to return to `/dashboard`.



\### Component library additions

\- \*\*Buttons:\*\* primary (gradient fill), secondary (glass/outline), ghost/text variants — consistent hover/active/disabled states with smooth transitions.

\- \*\*Sidebar:\*\* collapsible, glassmorphic, icon + label nav items, active-route highlighting.

\- \*\*Banners:\*\* dismissible glass banner component for stats/announcements (used on dashboard and results).

\- \*\*Sliders/carousels:\*\* if multiple candidates or multiple past sessions exist, use a smooth horizontal scroll/carousel component (Framer Motion drag or a lightweight library) rather than a static grid — this is one of the more distinctive, less commonly implemented UI patterns in typical hackathon submissions.

\- \*\*Theme toggle:\*\* icon-based (sun/moon) with smooth icon morph animation on switch.



\### Constraints

\- Do not break or modify existing backend integration, state machine, or API contract — this is frontend-only work layered on top of what's already verified working.

\- Keep bundle size reasonable — lazy-load routes with `React.lazy` + `Suspense` so the initial load stays fast.

\- Maintain the existing UI/UX requirements from the original build prompt (streaming, progress tracking, accessible components) — this phase adds visual distinction and page structure on top of that foundation, it doesn't replace those requirements.

\- Every new page needs a designed loading and empty state, matching the "no default browser ugliness" standard from before.

\- Test both light and dark themes on every new page before considering it done — a design that only works in one mode isn't finished.



\### Build process — follow this order

1\. Propose the design system (colors, typography, glass tokens) and page architecture plan. Confirm before implementing.

2\. Set up `react-router-dom` and the new route structure; verify navigation works with placeholder content on each page.

3\. Build the global theme system (light/dark toggle + Zustand/Context) and apply it to existing components first, to confirm it works before building new pages on top of it.

4\. Build the Home page.

5\. Build the Dashboard page.

6\. Restyle the existing Interview page to match the new system.

7\. Build the new dedicated Results page.

8\. Polish: animations, transitions, responsive check across all pages, both themes.

9\. Commit after each numbered step with a clear message, as established in the earlier build phase.



Begin by proposing the design system and page architecture plan before writing any code.



\---



\### Notes for you (not part of the prompt)

\- This is a large scope — expect this phase to take meaningfully longer than a single sitting. Prioritize order: theme system → Home → Dashboard → Results, since Home and Dashboard are what judges see \*first\* and will anchor their first impression before they even reach the interview mechanics.

\- Given your 36-hour budget is now partially spent on backend debugging, consider explicitly asking Antigravity to timebox: "If any single component (e.g. the carousel) is taking disproportionate effort, simplify it rather than blocking the rest of the UI work."

\- Screenshot-check both light and dark mode on each page as it's built — don't wait until the end to discover contrast/legibility issues across the whole app at once.



