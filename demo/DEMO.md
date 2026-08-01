# Teto CP5 walkthrough

Open `index.html` in any browser (no server needed). You should see:

1. **Brand** — large **Teto** wordmark and “Speak with your hands.”
2. **Mode chrome** — Sign → English selected, with Start signing CTA.
3. **Camera stage** — dominant stage showing detected signs `HELLO · YOU · THANKS`.
4. **English readout** — `Hello you thanks.` at 81% confidence.
5. **Gloss ticker** — tokens `HELLO`, `YOU`, `THANKS` animating in.
6. **Avatar clips (behind the scenes)** — `clip.HELLO`, `clip.YOU`, `clip.UNKNOWN` wired from the gloss sequence.

This page is a snapshot of `runIntegratedPipeline()` (CP5): synthetic ASL poses → stable signs → English + gloss → animation clips → UI shell.

Screenshots: `demo-desktop.png` (1280×800) and `demo-mobile.png` (390×844). Console log: `demo-console.txt`.
