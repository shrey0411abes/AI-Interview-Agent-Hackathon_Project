\# Antigravity Prompt — Precision Bug Fixes



Two issues, different confidence levels. Investigate before patching — don't guess.



\---



\## PROMPT



\### Bug 1 (CONFIRMED) — AnimatedNumber corrupts non-pure-numeric stat values



On the Home page, the stats banner displays corrupted values:

\- "5–10" (Interview questions) renders as "510"

\- "\~8 min" (Avg. session time) renders as "8"

\- "100%" (Test pass rate) renders as "100"



Root cause: `AnimatedNumber` is stripping non-digit characters and concatenating the remaining digits together, rather than preserving the original string structure.



Fix:

1\. Open the `AnimatedNumber` component and inspect how it parses its `value` prop.

2\. Rewrite it to correctly handle three cases:

&#x20;  - Pure numbers with a suffix (e.g. "100%") — animate the numeric part, keep the suffix static and unanimated.

&#x20;  - Ranges (e.g. "5–10") — do NOT attempt to animate these as a single number. Either render them fully static, or animate only the second number with the first number and dash as a static prefix (e.g. "5–" stays fixed, "10" counts up).

&#x20;  - Strings with embedded units (e.g. "\~8 min") — animate only the numeric portion, preserve "\~" prefix and " min" suffix as static text.

3\. Test all four home page stat values after the fix and confirm each displays EXACTLY its original intended text — "5–10", "3+", "\~8 min", "100%" — not corrupted digit concatenation.



\### Bug 2 (UNCONFIRMED — investigate first) — Possible duplicate message rendering



I observed messages rendering twice in the live chat during one earlier test session, but I've since reviewed ChatContainer.tsx, ChatInput.tsx, store.ts, and api.ts and found no code path that would cause double-firing — the SSE call, message state updates, and form submission all appear to fire exactly once per turn.



Two possibilities:

(a) This was already fixed incidentally during the Part 2 UI rebuild and no longer reproduces.

(b) It's a rendering-level issue in a component I haven't reviewed yet — most likely `MessageBubble.tsx`, or a key-prop/list-rendering issue causing React to render the same message data twice without it being duplicated in the underlying state array.



Do this in order:

1\. Run the dev server yourself and conduct a full live 8-question interview, watching the chat window closely for any message appearing twice.

2\. If it does NOT reproduce — tell me clearly that it's confirmed resolved, don't make speculative changes to working code.

3\. If it DOES reproduce — read `MessageBubble.tsx` and check for:

&#x20;  - Duplicate `key` props in any `.map()` rendering messages

&#x20;  - Any conditional rendering that could render the same message object twice under certain state combinations (e.g. once in the `messages.map()` list AND again in a separate streaming-specific render branch when `isStreaming` transitions)

&#x20;  - Confirm the transition moment specifically: does the "live streaming" message bubble and the "finalized" message bubble from `finishStreaming()` ever both render simultaneously for the same message before the streaming one is removed?

4\. Only implement a fix if you've reproduced and identified the exact cause — cite the specific line/logic causing it in your response before patching.



\### Constraints

\- Fix Bug 1 first (confirmed, straightforward) and commit it separately.

\- For Bug 2, report your findings (reproduced or not, and if reproduced, the exact cause) BEFORE writing any fix — I want to review the diagnosis before you patch anything, since I could not locate this bug through code review alone.

\- Run `python -m pytest -v` after both changes to confirm nothing regressed (should stay \~4s, all passing).



Start with Bug 1.



