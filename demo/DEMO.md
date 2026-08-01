# Teto CP5 walkthrough

Open `index.html` in any browser (no server needed). You should see:

1. **Brand** — large **Teto** wordmark and “Speak with your hands.”
2. **Appearance** — **Light / Dark** control in the top-right (persisted in `localStorage` as `teto-theme`)
3. **Mode chrome** — Sign → English selected, with Start signing CTA
4. **Camera stage** — dominant stage showing detected signs `HELLO · YOU · THANKS`
5. **English readout** — `Hello you thanks.` at 81% confidence
6. **Gloss ticker** — tokens `HELLO`, `YOU`, `THANKS`
7. **Avatar clips (behind the scenes)** — `clip.HELLO`, `clip.YOU`, `clip.UNKNOWN` wired from the gloss sequence

This page is a snapshot of `runIntegratedPipeline()` (CP5): synthetic ASL poses → stable signs → English + gloss → animation clips → UI shell.

Screenshots and console log: `/opt/cursor/artifacts/teto-demo/`.
