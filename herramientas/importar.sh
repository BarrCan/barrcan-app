#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
# BarrCan · Importar lo que te entrega Claude
# Toma los archivos de Descargas (compras_v1.22.html, barrcan_sw.js...),
# los pone en el repo con su nombre real, los valida, los sube a GitHub
# y mueve las descargas a "barrcan_importados" para que NUNCA vuelva
# a quedar una copia vieja suelta.
# ══════════════════════════════════════════════════════════════
REPO="$(cd "$(dirname "$0")/.." && pwd)"; cd "$REPO" || exit 1
./herramientas/sync.sh >/dev/null || { echo "⚠️ Primero hay que resolver la sincronización."; exit 1; }
for D in "$HOME/Descargas" "$HOME/Downloads"; do [ -d "$D" ] && { DESC="$D"; break; }; done
[ -z "${DESC:-}" ] && { echo "No encontré la carpeta de Descargas."; exit 1; }
ARCH="$DESC/barrcan_importados"; mkdir -p "$ARCH"
shopt -s nullglob
fuentes=(); destinos=(); ignorados=()
for src in "$DESC"/*.html "$DESC"/*.js; do
  nombre=$(basename "$src")
  limpio=$(printf '%s' "$nombre" | sed -E 's/_v[0-9][0-9.]*\.(html|js)$/.\1/')
  if   [ -f "$REPO/$limpio" ];          then destino="$limpio"
  elif [ -f "$REPO/modulos/$limpio" ];  then destino="modulos/$limpio"
  else ignorados+=("$nombre"); continue; fi
  cp "$src" "$REPO/$destino"
  if git diff --quiet -- "$destino"; then echo "= $destino ya estaba igual en GitHub"; mv "$src" "$ARCH/"; continue; fi
  git add "$destino"; fuentes+=("$src"); destinos+=("$destino")
  echo "→ $nombre  ⇒  $destino"
done
[ ${#ignorados[@]} -gt 0 ] && echo "· Ignorados (no existen en el repo): ${ignorados[*]}"
[ ${#destinos[@]} -eq 0 ] && { echo "Nada nuevo que importar."; exit 0; }
if git commit -q -m "Importado de Claude: ${destinos[*]}"; then
  git push -q origin main && echo "✅ Subido a GitHub: ${destinos[*]}"
  for s in "${fuentes[@]}"; do mv "$s" "$ARCH/"; done
else
  git restore --staged --worktree -- "${destinos[@]}"
  echo "⛔ No se subió nada. Tus descargas siguen donde estaban."
  exit 1
fi
