@AGENTS.md

## Notas específicas de Claude Code

- Las instrucciones del proyecto viven en `AGENTS.md`; no duplicarlas aquí. Todo cambio de reglas se hace en `AGENTS.md`.
- El MCP de Stitch se configura en `.mcp.json` (ya incluido). Requiere la variable de entorno `STITCH_API_KEY` definida en el shell desde el que se lanza Claude Code. Verificar con `claude mcp list`.
- Skills del proyecto: `.claude/skills/`. Ver `skills/README.md` para la lista recomendada y `documentacion/12-agentes-de-desarrollo.md` para la compatibilidad entre agentes.
