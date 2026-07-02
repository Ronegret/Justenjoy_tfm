#!/usr/bin/env bash
#
# check-gitflow-branch.sh — Política de ramas Git Flow en pre-push.
#
# Objetivo: impedir errores comunes ANTES de que lleguen al remoto:
#   1. Push directo a las ramas base (master / develop).
#   2. Ramas de trabajo con nombres fuera de la convención de Git Flow.
#
# LÍMITE IMPORTANTE: esto es una red temprana LOCAL. Se puede saltar con
# `git push --no-verify`. La imposición real vive en la branch protection de
# GitHub (master y develop protegidas, PR obligatorio). Ver docs/git-flow.md.
#
# pre-commit invoca este hook en la fase pre-push. La rama actual se obtiene
# con `git symbolic-ref` porque los args de pre-push (refs por stdin) no son
# fiables entre plataformas.

set -euo pipefail

# Ramas base: nunca se hace push directo; se integran vía Pull Request.
BASE_BRANCHES="master develop"

# Prefijos de trabajo permitidos por Git Flow, más chore/ y docs/ (convención
# habitual para tareas de mantenimiento y documentación en este repo).
ALLOWED_PREFIXES="feature/ bugfix/ release/ hotfix/ support/ chore/ docs/"

branch="$(git symbolic-ref --short HEAD 2>/dev/null || echo '')"

if [ -z "$branch" ]; then
  # HEAD desprendido (p. ej. push de un tag). No aplicamos política.
  exit 0
fi

# 1) Bloquear push directo a ramas base.
for base in $BASE_BRANCHES; do
  if [ "$branch" = "$base" ]; then
    echo "✖ Git Flow: push directo a '$base' bloqueado." >&2
    echo "  '$base' se actualiza SOLO mediante Pull Request." >&2
    echo "  Crea una rama de trabajo:  git switch -c feature/mi-cambio" >&2
    exit 1
  fi
done

# 2) Validar convención de nombre en ramas de trabajo.
for prefix in $ALLOWED_PREFIXES; do
  case "$branch" in
    "$prefix"*)
      exit 0
      ;;
  esac
done

echo "✖ Git Flow: nombre de rama no válido: '$branch'." >&2
echo "  Usa uno de estos prefijos:" >&2
echo "    feature/<nombre>   nueva funcionalidad (parte de develop)" >&2
echo "    bugfix/<nombre>    corrección sobre develop" >&2
echo "    release/<version>  preparación de versión" >&2
echo "    hotfix/<version>   corrección urgente sobre master" >&2
echo "    support/<nombre>   mantenimiento de versión antigua" >&2
echo "    chore/<nombre>     tareas de mantenimiento (build, config, deps)" >&2
echo "    docs/<nombre>      solo documentación" >&2
exit 1
