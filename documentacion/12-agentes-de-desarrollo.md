# Agentes de Desarrollo

Este proyecto se desarrolla con agentes de código. Agentes en uso: **Antigravity** (IDE y CLI `agy`) y **OpenCode**. **Claude Code** se incorporará más adelante y ya está soportado. Cualquier otro agente que lea `AGENTS.md` puede trabajar en el proyecto.

## Principio

Una sola fuente de instrucciones: **`AGENTS.md`**. Los archivos específicos de cada agente solo apuntan a él o contienen configuración de MCP. Nunca duplicar reglas del proyecto en archivos por agente.

## Matriz de compatibilidad

| Elemento | Antigravity | OpenCode | Claude Code |
|---|---|---|---|
| Instrucciones del proyecto | `AGENTS.md` (opcional `GEMINI.md`, que tiene precedencia en Antigravity) | `AGENTS.md` | `CLAUDE.md`, que importa `AGENTS.md` con `@AGENTS.md` |
| MCP del proyecto | Config global del usuario (ver nota) | `opencode.json` (clave `mcp`) | `.mcp.json` |
| Skills | `.agents/skills/` (versiones anteriores: `.agent/skills/`) | Instaladas con `npx skills add` | `.claude/skills/` |
| Variable de la clave de Stitch | Valor en la config global (fuera del repo) | `{env:STITCH_API_KEY}` | `${STITCH_API_KEY}` |

Nota sobre Antigravity: la ubicación de `mcp_config.json` cambió entre versiones (`~/.gemini/antigravity/`, `~/.gemini/config/`, y `.agents/` a nivel de proyecto según la fuente). La forma fiable de abrirlo es desde la UI: panel del agente → MCP Servers → Manage MCP Servers → View raw config.

## MCP de Stitch (servidor oficial de Google)

Endpoint: `https://stitch.googleapis.com/mcp`, autenticado con la cabecera `X-Goog-Api-Key`. Se conecta mediante el puente `mcp-remote`. Nombre del servidor en todos los agentes: `StitchMCP`.

### OpenCode — `opencode.json` (ya incluido en el repo)

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "StitchMCP": {
      "type": "local",
      "command": ["npx", "-y", "mcp-remote", "https://stitch.googleapis.com/mcp",
                  "--header", "X-Goog-Api-Key: {env:STITCH_API_KEY}"],
      "enabled": true
    }
  }
}
```

Verificar: `opencode mcp list`.

### Claude Code — `.mcp.json` (ya incluido en el repo)

```json
{
  "mcpServers": {
    "StitchMCP": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://stitch.googleapis.com/mcp",
               "--header", "X-Goog-Api-Key: ${STITCH_API_KEY}"]
    }
  }
}
```

Verificar: `claude mcp list`.

### Antigravity — `mcp_config.json` global del usuario

Este archivo vive fuera del repositorio. Pegar el siguiente bloque dentro de `mcpServers`, sustituyendo el marcador por la clave real:

```json
"StitchMCP": {
  "command": "npx",
  "args": ["-y", "mcp-remote", "https://stitch.googleapis.com/mcp",
           "--header", "X-Goog-Api-Key: <TU_STITCH_API_KEY>"]
}
```

Después, recargar el panel MCP. Si el archivo está dentro del workspace (`.agents/mcp_config.json`), queda ignorado por `.gitignore`: nunca versionarlo.

## Manejo de la clave de Stitch

- La clave **nunca** se escribe en archivos versionados, documentación, issues ni mensajes.
- Para OpenCode y Claude Code, definir `STITCH_API_KEY` en el entorno del shell (`export STITCH_API_KEY=...` en el perfil del shell; en Windows, variable de usuario). Estos agentes no cargan `.env` automáticamente. `.env.example` solo documenta el nombre.
- Para Antigravity, la clave va únicamente en su `mcp_config.json` global.
- Si una clave se expone (chat, commit, captura), se rota de inmediato y se revoca la anterior.

## Skills entre agentes

El formato `SKILL.md` es común. `npx skills add <repo> --skill <nombre>` instala en la ubicación de cada agente detectado; consultar `npx skills add --help` para seleccionar agentes. La lista recomendada está en `skills/README.md`. Las skills pueden ejecutar código: revisar antes de instalar las que no sean oficiales.

## Reglas para cualquier agente

1. Leer `AGENTS.md` antes de escribir código.
2. No introducir archivos de configuración propios de un agente con reglas distintas a `AGENTS.md`.
3. No escribir ni mostrar credenciales; usar siempre variables de entorno.
4. Si un agente no encuentra el MCP de Stitch, comprobar primero que `STITCH_API_KEY` está definida en el entorno desde el que se lanzó.

## Git y CI

Los agentes siguen el mismo flujo que las personas: GitFlow, Conventional Commits en español y PR con el CI en verde. Las reglas están en `AGENTS.md` (sección 12) y el detalle en `documentacion/13-gitflow-y-ci.md`. Antes de abrir un PR, `pnpm check` reproduce en local los chequeos del CI.

