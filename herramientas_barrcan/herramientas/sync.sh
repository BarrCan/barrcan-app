#!/usr/bin/env bash
# BarrCan · Sincronización automática (la corre el programador de tareas)
# Baja lo nuevo de GitHub y sube lo que se quedó sin subir en esta máquina.
cd "$(dirname "$0")/.." || exit 1
ahora() { date '+%Y-%m-%d %H:%M'; }
git fetch --quiet origin 2>/dev/null || { echo "$(ahora) sin red, se intenta luego"; exit 0; }
if ! git pull --rebase --autostash --quiet origin main 2>/dev/null; then
  git rebase --abort 2>/dev/null
  msg="BarrCan: conflicto al sincronizar en $(hostname). Avísale a Claude antes de seguir."
  command -v notify-send >/dev/null 2>&1 && notify-send "BarrCan" "$msg"
  echo "$(ahora) ⚠️ $msg"; exit 1
fi
if [ -n "$(git log origin/main..HEAD --oneline 2>/dev/null)" ]; then
  git push --quiet origin main && echo "$(ahora) ↑ subidos commits pendientes"
fi
echo "$(ahora) ok · $(git rev-parse --short HEAD)"
