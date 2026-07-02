# Skills y convenciones del proyecto

Este directorio contiene los skills y guías de referencia que se aplican al desarrollo
de `apirestequipment`. Están en Markdown plano para que cualquier miembro del equipo
pueda leerlos sin instalar Hermes Agent.

## Contenido

| Skill | Proposito | Cuando aplicarlo |
| --- | --- | --- |
| [requesting-code-review](./requesting-code-review.md) | Pipeline de verificacion pre-commit: scan de seguridad, tests baseline, reviewer independiente. | Antes de cualquier `git commit` o `git push` que toque 2+ archivos. Obligatorio en cambios de auth/password. |
| [nest-hexagonal-pattern](./nest-hexagonal-pattern.md) | Convencion de arquitectura hexagonal del proyecto (ports & adapters, NestJS 11, Drizzle, Postgres). | Al crear un modulo nuevo, migrar uno anemia, o revisar que un cambio respeta la estructura `<entity>/{schema,interfaces,dto,ports,adapters,service,controller}`. |

## Skills relacionados (no copiados, disponibles via Hermes Agent)

- `software-development/sdd-ligero-workflow` — spec-driven development ligero para cambios no triviales.
- `software-development/test-driven-development` — RED-GREEN-REFACTOR enforced.
- `software-development/plan` — escribir plan en `.hermes/plans/` antes de codear.

## Workflow recomendado

1. Cambio no trivial? -> cargar `sdd-ligero-workflow` o `plan`.
2. Modulo nuevo o refactor hexagonal? -> leer `nest-hexagonal-pattern.md` completo.
3. Codear con TDD -> `test-driven-development`.
4. Antes de commit -> ejecutar el pipeline de `requesting-code-review.md`.
5. Commit con prefix `[verified]` si paso el reviewer independiente.
