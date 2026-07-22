#!/usr/bin/env bash
# Mezcla el ambiente del home: olas NATIVAMENTE suaves (mar en calma, generadas sin reventones)
# + jazz de fondo, con fade in/out. Capas en .ambient-cand/{waves,jazz}.wav. Perillas: WAVES_VOL,
# JAZZ_VOL. Procesamiento MÍNIMO a propósito (solo EQ suave + nivel, sin compresor ni limiter): la
# suavidad viene de la generación, no de aplastar (eso sonaba "truqueado"/glitch). Uso: bash scripts/mix-ambient.sh
set -euo pipefail
cd "$(dirname "$0")/.."

WAVES_VOL="${WAVES_VOL:-1.0}"
JAZZ_VOL="${JAZZ_VOL:-0.14}"   # olas:jazz ~6:1 con las capas actuales
OUT="public/hero/olas-bg.mp3"

DUR=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 .ambient-cand/waves.wav)
FOUT=$(python3 -c "print(round(${DUR}-3.2,2))")

ffmpeg -y -hide_banner -loglevel error \
  -i .ambient-cand/waves.wav -i .ambient-cand/jazz.wav \
  -filter_complex "\
[0:a]highpass=f=45,lowpass=f=7500,volume=${WAVES_VOL}[w];\
[1:a]highpass=f=90,volume=${JAZZ_VOL}[j];\
[w][j]amix=inputs=2:duration=shortest:dropout_transition=0:normalize=0[m];\
[m]afade=t=in:st=0:d=2.5,afade=t=out:st=${FOUT}:d=3.2,loudnorm=I=-17:TP=-1.5:LRA=11[o]" \
  -map "[o]" -ar 44100 -b:a 160k "$OUT"

echo "OK -> $OUT (waves=${WAVES_VOL} jazz=${JAZZ_VOL})"
ffmpeg -hide_banner -i "$OUT" -af astats -f null /dev/null 2>&1 | grep -m1 "Crest factor"
