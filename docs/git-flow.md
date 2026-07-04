# Flujo de trabajo Git — Git Flow

Este repositorio sigue **Git Flow**. El objetivo es que `master` sea siempre
desplegable y que la integración ocurra de forma ordenada a través de `develop`.

## Ramas base (permanentes)

| Rama      | Rol                                                        | Se toca vía |
|-----------|------------------------------------------------------------|-------------|
| `master`  | Producción. Cada commit corresponde a una versión liberada. | Solo Pull Request |
| `develop` | Integración. Base de todo el trabajo en curso.             | Solo Pull Request |

**Nunca** se hace push directo a `master` ni a `develop`. Está bloqueado tanto
por hook local como por la branch protection de GitHub.

## Ramas de trabajo (temporales)

| Prefijo      | Para qué                              | Parte de  | Se integra en        |
|--------------|---------------------------------------|-----------|----------------------|
| `feature/`   | Nueva funcionalidad                   | `develop` | `develop`            |
| `bugfix/`    | Corrección no urgente                 | `develop` | `develop`            |
| `release/`   | Preparación de una versión            | `develop` | `master` y `develop` |
| `hotfix/`    | Corrección urgente en producción      | `master`  | `master` y `develop` |
| `support/`   | Mantenimiento de una versión antigua  | tag/master| —                    |
| `chore/`     | Mantenimiento (build, config, deps)   | `develop` | `develop`            |
| `docs/`      | Solo documentación                    | `develop` | `develop`            |

## Ciclo típico de una feature

```bash
git switch develop
git pull
git switch -c feature/mi-cambio
# ... trabajo y commits ...
git push -u origin feature/mi-cambio
# Abrir Pull Request contra develop en GitHub
```

## Cómo se impone

1. **Branch protection en GitHub (imposición real).** `master` y `develop`
   rechazan push directo y exigen Pull Request. No se puede evitar con
   `--no-verify`. Se configura con **0 aprobaciones requeridas** a propósito:
   el proyecto lo lleva un único desarrollador y GitHub no permite que el autor
   apruebe su propio PR; con 0, puedes mergear tu propio PR pero sigues obligado
   a pasar por él. Se activa ejecutando
   [`.githooks/setup-github-protection.sh`](../.githooks/setup-github-protection.sh)
   con una cuenta **admin** del repositorio (el owner). Requiere permisos que
   una cuenta de solo push no tiene.
2. **Hook local `pre-push` (red temprana).** Bloquea el push directo a ramas
   base y valida el nombre de la rama contra los prefijos de arriba. Es local y
   evitable con `--no-verify`; su función es avisar antes de llegar al remoto.
   Implementado en [`.githooks/check-gitflow-branch.sh`](../.githooks/check-gitflow-branch.sh)
   y registrado en [`.pre-commit-config.yaml`](../.pre-commit-config.yaml).
3. **Configuración `git flow`.** `git config gitflow.*` fija `master`/`develop`
   como ramas base y los prefijos, para quien use la extensión `git-flow`.

## Rama por defecto

`develop` es la rama por defecto del repositorio en GitHub: los nuevos Pull
Requests apuntan a ella salvo que se cambie explícitamente el destino.
