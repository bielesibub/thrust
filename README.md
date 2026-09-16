# Thrust — browser reconstruction

A self-contained HTML/JavaScript reconstruction of the BBC Micro game by Jeremy C. Smith, based on [Kieran HJ Connell’s disassembly](https://github.com/kieranhj/thrust-disassembly).

**[▶ Play](https://html-preview.github.io/?url=https://github.com/bielesibub/thrust/main/index.html)** or open `index.html` in a browser, or run:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Then visit http://127.0.0.1:8765/. No build step, external assets, or runtime dependencies are required.

## Playing

Press Space or Continue through the illustrated intro, instructions, and high-score table. Z/X (or arrow keys) rotate, Shift/Up thrusts, Enter fires, and Space activates the shield/tractor. P pauses and S toggles sound.

Recover the pod and escape to orbit. Collect fuel, destroy guns, operate switches, and optionally trigger the reactor countdown. Includes six original landscapes, later mission modifiers, synthesized sound, escape effects, and locally saved top-eight scores.

## Development

```sh
git clone --recurse-submodules https://github.com/bielesibub/thrust.git
cd thrust
node tools/test.cjs
python3 tools/extract.py
```

For an existing checkout, use `git submodule update --init` before extracting source data. The reference submodule is only needed for extraction; it is not required to play or run the tests.

The supplied illustrated splash is embedded as a base64 PNG. Original game data and imagery retain their original attribution; inclusion is not a claim of ownership.

See [FIDELITY.md](FIDELITY.md) for source provenance, timing decisions, verification, and remaining differences from the original.
