#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
# BarrCan · Instalación (UNA sola vez por máquina)
#   Linux (Green):   cd ~/BarrCan && bash herramientas/instalar.sh
#   Windows:         abrir "Git Bash" y:
#                    cd ~/Documents/BarrCan && bash herramientas/instalar.sh
# ══════════════════════════════════════════════════════════════
REPO="$(cd "$(dirname "$0")/.." && pwd)"; cd "$REPO" || exit 1
git config core.hooksPath herramientas/hooks
git config pull.rebase true
git config rebase.autoStash true
chmod +x herramientas/*.sh herramientas/hooks/* 2>/dev/null
echo "✅ Guardián de versiones activado en este repo"

case "$(uname -s)" in
  Linux*)
    ( crontab -l 2>/dev/null | grep -v 'herramientas/sync.sh'
      echo "*/15 * * * * $REPO/herramientas/sync.sh >> $HOME/.barrcan_sync.log 2>&1"
      echo "@reboot sleep 90 && $REPO/herramientas/sync.sh >> $HOME/.barrcan_sync.log 2>&1"
    ) | crontab -
    echo "✅ Sincronización automática: cada 15 min y al encender (log: ~/.barrcan_sync.log)"
    ;;
  MINGW*|MSYS*|CYGWIN*)
    BASHW=$(cygpath -w "$(command -v bash)")
    VBS="$HOME/barrcan_sync_oculto.vbs"
    # Lanzador invisible: sin esto se abriría una ventana negra cada 15 min.
    printf 'CreateObject("WScript.Shell").Run """%s"" -lc ""%s/herramientas/sync.sh >> ~/barrcan_sync.log 2>&1""", 0, False\r\n' \
      "$BASHW" "$REPO" > "$VBS"
    VBSW=$(cygpath -w "$VBS")
    MSYS_NO_PATHCONV=1 schtasks.exe /Create /F /TN "BarrCan Sync" /SC MINUTE /MO 15 /TR "wscript.exe \"$VBSW\"" >/dev/null \
      && echo "✅ Sincronización automática cada 15 min (log: ~/barrcan_sync.log)"
    MSYS_NO_PATHCONV=1 schtasks.exe /Create /F /TN "BarrCan Sync al iniciar" /SC ONLOGON /TR "wscript.exe \"$VBSW\"" >/dev/null 2>&1 \
      && echo "✅ También al iniciar sesión" \
      || echo "· (Al iniciar sesión requiere abrir Git Bash como administrador; lo de cada 15 min ya basta)"
    ;;
esac
./herramientas/sync.sh
echo ""; echo "Listo. Para meter lo que te entregue Claude:  bash herramientas/importar.sh"
