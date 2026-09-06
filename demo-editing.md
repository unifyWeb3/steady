# Demo Editing Handoff (for Claude + Remotion)

Source: Recordly folder from `demo.md` — clips `01-homepage` … `06-close` + the recorded human voice track. Output: one 2:40 MP4, 1280×800 minimum, no generic AI-video styling.

## Inputs (what you receive)
- 6 clips in shot order (already sequenced 1→11 per `demo.md`), Recordly voiceover (human, live — polish levels and pacing, do NOT replace with synthetic voice), this file + `demo.md` as direction.

## Pacing & cuts
- Hard cuts between the 11 shots in `demo.md`; no transitions longer than 200ms. Total 2:40.
- Silence trimming: cut wallet-popup waiting dead air to a 1s "signing…" title card, then cut back on hash appearance.
- Keep all real waiting that proves liveness (countdown tick, receipt poll) — cut only dead air.

## Voice & subtitles
- Keep the human voice throughout; clean noise, level evenly, never re-record lines.
- Burned-in subtitles for every voiceover line (JetBrains Mono for numbers/hashes, Newsreader for prose), plus SRT sidecar. Hash callouts stay on screen ≥3s.

## Captions & callouts (facts, not hype)
- Lower third on first terminal shot: "Steady · DreamDEX Event Contracts · Somnia Shannon testnet".
- Hash callouts (mono, also pasted in video description): execution hash, redemption `0x3aa5ec…`.
- Policy callouts: zoom 110% on the Policy Control Gate box; caption "Policy decides before the wallet signs".
- Actual-vs-quoted emphasis: split overlay "quoted 0.049 → filled 0.021" held 3s. This is the technical centerpiece — do not rush it.
- Section titles (serif, 1s each): Problem / Decision / Policy / Execution / Proof / Discipline / Why it matters.

## Polish rules
- Subtle zooms only (≤110%) on ticket numbers, policy badge, receipt hashes.
- Final CTA frame: production URL + "Testnet only · Not financial advice" for 4s.
- No stock footage, no gradient backgrounds, no emoji, no sound effects except a single soft click on execution.
- Export: MP4 H.264 + SRT captions; upload unlisted to YouTube for the BUIDL form and drop the link into README + handoff.
