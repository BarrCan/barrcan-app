# Herramientas BarrCan — sincronización y guardián de versiones

## Regla de oro
**GitHub es la única verdad.** Nunca edites ni subas archivos desde Descargas
a mano. Todo entra por `importar.sh`.

## Instalación (una sola vez por máquina)
1. Copia la carpeta `herramientas/` a la raíz del repo, súbela a GitHub
   (GitHub Desktop: commit + push). La otra máquina la recibe al hacer pull.
2. Instala en cada máquina:
   - **PC Green (Linux):** `cd ~/BarrCan && bash herramientas/instalar.sh`
   - **Laptop (Windows):** abrir **Git Bash** →
     `cd ~/Documents/BarrCan && bash herramientas/instalar.sh`
     (Git Bash viene con "Git for Windows": https://git-scm.com/download/win)

## Uso diario
| Situación | Qué hacer |
|---|---|
| Claude te entregó archivos | Descárgalos y corre `bash herramientas/importar.sh` |
| Trabajas en la otra máquina | Nada: se pone al día sola cada 15 min |
| ¿Quieres forzar ponerte al día? | `bash herramientas/sync.sh` |
| El guardián bloqueó algo | Lee el mensaje ❌; no se subió nada |

## Qué hace cada pieza
- **hooks/pre-commit** — bloquea: copias viejas sobre nuevas, cambios sin subir
  versión, encabezado ≠ APP_VERSION, nombres con `_vX.Y`.
  Excepción: `git commit --no-verify`.
- **sync.sh** — baja lo nuevo de GitHub y sube commits que se quedaron sin push.
  Si hay conflicto, se detiene y avisa (no mezcla nada a ciegas).
- **importar.sh** — mete lo de Descargas con su nombre real, valida, sube, y
  archiva las descargas en `Descargas/barrcan_importados/`.
- **Logs:** Linux `~/.barrcan_sync.log` · Windows `~/barrcan_sync.log`
