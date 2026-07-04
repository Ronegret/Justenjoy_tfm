#!/usr/bin/env bash
#
# setup-github-protection.sh — Imposición de Git Flow en GitHub.
#
# Aplica la parte de Git Flow que NO puede vivir en local:
#   1. Cambia la rama por defecto del repositorio a 'develop'.
#   2. Protege 'master' y 'develop': prohíbe push directo, exige Pull Request.
#
# REQUISITO: ejecutarlo con una cuenta que tenga permiso ADMIN sobre el repo
# (p. ej. el owner Ronegret). Con permisos de solo push, GitHub devuelve 404.
#
# Uso:
#   gh auth login          # con la cuenta admin
#   bash .githooks/setup-github-protection.sh

set -euo pipefail

REPO="Ronegret/Justenjoy_tfm"
# Nº de aprobaciones requeridas en cada PR.
# Se deja en 0 a propósito: el proyecto lo lleva un único desarrollador y
# GitHub NO permite que el autor apruebe su propio PR. Con 0, el autor puede
# mergear su propio PR, pero sigue OBLIGADO a pasar por Pull Request (no hay
# push directo a las ramas base). Subir a 1 solo si entra otro revisor.
REVIEWS=0

echo "==> Verificando permisos admin sobre $REPO ..."
is_admin="$(gh api "repos/$REPO" --jq '.permissions.admin')"
if [ "$is_admin" != "true" ]; then
  echo "✖ La cuenta autenticada no tiene admin sobre $REPO." >&2
  echo "  Ejecútalo el owner (Ronegret) o alguien con rol admin." >&2
  exit 1
fi

echo "==> Cambiando rama por defecto a 'develop' ..."
gh api -X PATCH "repos/$REPO" -f default_branch=develop >/dev/null
echo "    OK."

# Protección idéntica para ambas ramas base.
for branch in master develop; do
  echo "==> Protegiendo rama '$branch' ..."
  gh api -X PUT "repos/$REPO/branches/$branch/protection" \
    --input - <<JSON >/dev/null
{
  "required_status_checks": null,
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": $REVIEWS,
    "dismiss_stale_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_linear_history": false
}
JSON
  echo "    OK: push directo bloqueado, PR obligatorio ($REVIEWS aprobaciones requeridas)."
done

echo ""
echo "✔ Git Flow impuesto en GitHub. Comprobación:"
gh api "repos/$REPO" --jq '{default_branch}'
