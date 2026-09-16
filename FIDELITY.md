# Thrust reconstruction

Open `index.html` directly in a browser. It contains the complete game, graphics, level data, and Web Audio synthesis. There are no runtime dependencies or external requests. Alternatively run `python3 -m http.server 8765 --bind 127.0.0.1` and visit http://127.0.0.1:8765.

## Reference and provenance

The initial game reference is the existing local checkout of https://github.com/kieranhj/thrust-disassembly/, especially `disasm/thrust.6502`. Its recorded master revision is `dbca355cc699a6af14453af6a5fe1524d4a75769`. The local source contains additional annotations; its accompanying documents were checked against assembly instructions rather than treated as authoritative. Network retrieval of the upstream repository was unavailable during this work. No other game's version, ROM, soundtrack, graphics, library, or reference video was imported.

`python3 tools/extract.py` regenerates eleven inline data groups directly from assembly labels: terrain, object positions/types/parameters, ship sprites, pod sprite, static sprites, font, envelopes, respawn tables, the status-bar bitmap, the MODE 7 instruction stream, and original high-score defaults. The respawn tables are retained for future checkpoint fidelity; the current death flow restarts the current landscape.

## Recovered behaviour

- Six terrain streams and all placed objects, original MODE 1 sprite byte data, 17 ship orientations plus horizontal mirroring for 32 headings, shield, pod, guns, tanks, reactor and switches.
- Custom 288 × 240 logical display: CRTC R1 = 72 columns, four MODE 1 pixels per byte; R6 = 30 and R9 = 7 yield 240 lines. Sixteen lines are reserved for status. CSS presents this at a conventional 4:3 display aspect, with nearest-neighbour scaling; fractional browser scaling may produce uneven pixel widths.
- Four logical colours, with per-level landscape/object palettes, and the source's five-row font. The HUD is decoded directly from `status_bar_bytes`, with the original fuel/lives/score order and numeric destinations. The intro interprets `mode_7_instructions`; a system monospace font substitutes for the absent teletext ROM font. Browser controls are additions. The user-provided screenshot also informs the HUD and fuel-beam comparison.
- Terrain starts at the correct world depth, including the circular decoder's 256-row lookahead and unsigned 8-bit wall arithmetic. Objects use four horizontal pixels and two vertical pixels per source coordinate unit.
- Rotation skips every fourth tick. Gravity, thrust and drag update on ticks 0, 3, 5, 8, 11, 13 of each block of sixteen. Integration precedes the next force calculation. Original angle/gravity tables and unequal horizontal/vertical damping are used.
- Fuel pickup draws the two outward-sloping lines in `tick_fuel_pickup_draw_beams`, flashing on alternate ticks. The pod has a separate centre-to-centre line using the +16 X / +10 Y offsets in `calculate_line_coordinates`.
- Attached bodies share a midpoint, half thrust and momentum, interpolated tether angles, and thrust-induced angular motion. The tractor uses the source's `3*max(dx,dy)+min(dx,dy)` distance metric and two activation/attachment thresholds.
- Guns use the source spread masks and level probability, and a translation of the source PRNG with a fixed reproducible seed. Reactor damage accumulates permanently in random 0–31 increments until overflow, while a separate temporary counter disables guns. Countdown steps are 33 logic ticks.
- All three late-level doors alter the terrain using source coordinates and opening/closing counters. Reverse-gravity and invisible-landscape mission cycles are present.
- Source scoring: 75 per gun, 15 for shooting fuel, 30 for collecting fuel; mission bonus `400*(level+5)`, with 2000 extra for a critical planet. Extra lives at 1000-point boundaries. High score and pacing preference persist locally when storage is available.

## Timing

`draw_player_timed_to_vsync` waits until the OS 100 Hz clock reaches three ticks and then resets it. The JavaScript model therefore uses a rational 100/3 Hz logic clock (30 ms). This is a minimum clock gate, not evidence that real hardware always completed a frame every 30 ms. Source drawing/workload and interrupt phase can lengthen it.

The CRTC settings imply 128 × 312 microseconds per video frame, or about 50.0801 Hz given the standard BBC MODE 1 clock. This machine clock is an assumption, not independently measured from the supplied files. Browser presentation and logic are separate. Exact raster/interrupt phases and workload slowdowns are not emulated.

Original speed retains the 30 ms accumulator remainder. Smooth cadence chooses the closest whole browser-refresh divisor and shows its signed speed difference. Neither mode interpolates rendered motion. Effective browser cadence is estimated from a robust 180-interval sample; sustained changes update the fit. More than 240 ms suspension pauses play rather than silently losing simulation time. Hidden tabs and focus loss pause and clear held controls.

## Audio and music

The source supplies nine SOUND parameter blocks and four envelopes. The port now renders deterministic PCM square tones and shift-register noise with pitch sections and attack/decay/sustain/release amplitude phases. It models 2 dB volume steps, a ten-bit tone divider, fixed noise rates and tone-channel-linked noise, four independent channel queues, and the SOUND flush flag. SOUND pitch is interpreted as BBC pitch, not as a raw SN76489 divider, and channel zero is noise. Durations and pitch-step timing follow selected game pacing; oscillator pitch remains independent.

There is no music sequence or music player in the supplied source. The earlier prototype's invented title tune has been removed. A soundtrack cannot be reproduced from these files, so none is claimed or added.

Audio limitations: this is a bounded software model, not BBC MOS or chip emulation. The 4 MHz chip clock, pitch conversion, envelope interpreter details, phase resets and noise feedback need hardware verification; the ROM implementation is not included in the permitted reference. Noise tied to channel 3 samples its pitch at voice creation, rather than following every subsequent envelope update. Queues and release tails have protective length limits. Envelope 2 supplies only thirteen bytes; the model takes the adjacent envelope-3 number as the fourteenth byte, as a sequential fourteen-byte read would. Pause, mute and pacing changes clear scheduled voices. PCM tests check finite samples, signal/silence and timing. Audio has not been compared by ear or waveform against original hardware.

## Known limitations

This is a playable native JavaScript reconstruction, not a cycle-accurate emulator or a verified pixel-perfect port. Remaining differences include exact fixed-point overflow/rounding, tether angular impulse, collision update ordering/XOR residue semantics, source camera thresholds, bullet subpixel collision, checkpoint and object persistence after death, arrival teleport/death animations, the automated attract demo, and exact invisible-landscape reveal behaviour. The browser practice selector is an addition. Terrain and object assets are source-derived; these remaining behavioural approximations are explicit.

## Verification

Run `node tools/test.cjs` from this directory. Tests execute the actual inline game code with a minimal DOM/canvas adapter. They cover six maps and sprite bounds; clear spawn and pod locations; gravity, thrust, fuel use and rotation; two-stage tractor attachment; fuel collection; reactor destruction; terrain collisions; door opening and timed closing; repeat missions and death after mission six; pause/input clearing and overload handling.

Synthetic timing tests cover 50, 60, 100, 120, 144 and 59.94 Hz browser timestamps over a minute, plus uniform hold counts in smooth mode. Tests validate scheduler arithmetic, not physical scanout. The available browser estimated approximately 120.5 Hz. Title/start/pause/restart and rendering were inspected in that browser with no reported JavaScript errors. No hardware oracle or full human playthrough of all six missions was available.

The source confirms a MODE 7 instructions screen at boot, and a separate “Top 8 Thrusters” high-score/attract sequence. The illustrated splash (supplied explicitly by the user), instructions and high-score table are now included; the automated attract demo remains unimplemented.

## Illustrated splash and high scores

The user-supplied `codex-clipboard-71997523-d148-4cb2-9e83-331cd2c63c14.png` is embedded unchanged as a base64 PNG data URI in the HTML. This explicitly requested asset is additional to the original repository-only reference. No image download or separate runtime file is required. Press Space/Enter or Continue through illustration, instructions, and high scores to begin.

The eight default names and three-byte BCD scores are extracted from `high_score_table_relocated` (20,000 down to 500). A score equal to an existing entry qualifies, matching the comparison in the assembly. Qualifying game overs prompt for a nine-character name, insert the entry in rank order, and retain the top eight. Names and scores persist under `thrust.highscores.v1` in local storage. Blocked storage falls back to a working in-memory table; malformed stored tables fall back to the source defaults. The browser name-entry field is an accessible adaptation of the original keyboard prompt.

Additional checks cover startup flow, eight-entry ranking, score ties, name limits, repeated-submit protection, persistence, corrupt/blocked storage, and silent transitions after death. Splash and table rendering were inspected in the browser without JavaScript errors.

## Escape transition and HUD score correction

The HUD clears the fixed zero at x=256–262 that is part of the original status bitmap, so the displayed value now agrees with the port's numeric score and saved table. Pixel-level tests compare the score field for 0, 75, 1050 and 123456.

Successful orbit entry freezes gameplay, plays the orbit sound, and draws XOR-derived pixel patterns around both ship and pod from `plot_teleport_effect_2/3`: six build-up stages and reverse erasure with two-frame holds. A short pre/post delay separates escape from the next mission; delays are mapped to the port's 30 ms clock rather than emulating interrupt phase. Bonus scoring and mission advance occur once, after the effect. Pause/resume, frozen physics, full effect erasure and delayed progression are regression-tested.
