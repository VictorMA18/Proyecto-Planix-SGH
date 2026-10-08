"""Valida api/openapi.yaml: YAML correcto, $ref resueltos, tags declarados,
respuestas definidas y parámetros de ruta declarados."""
import re
import sys

import yaml

RUTA = "api/openapi.yaml"
METODOS = {"get", "put", "post", "delete", "patch", "options", "head"}

errores = []
with open(RUTA, encoding="utf-8") as archivo:
    spec = yaml.safe_load(archivo)


def resolver(ref):
    if not ref.startswith("#/"):
        return None
    nodo = spec
    for parte in ref[2:].split("/"):
        if not isinstance(nodo, dict) or parte not in nodo:
            return None
        nodo = nodo[parte]
    return nodo


def recorrer(nodo, ruta):
    if isinstance(nodo, dict):
        for clave, valor in nodo.items():
            if clave == "$ref" and isinstance(valor, str) and resolver(valor) is None:
                errores.append(f"{ruta}: $ref sin resolver -> {valor}")
            recorrer(valor, f"{ruta}/{clave}")
    elif isinstance(nodo, list):
        for i, valor in enumerate(nodo):
            recorrer(valor, f"{ruta}[{i}]")


if not str(spec.get("openapi", "")).startswith("3."):
    errores.append("openapi: falta la versión 3.x")

recorrer(spec, "#")

tags_declarados = {t["name"] for t in spec.get("tags", [])}


def parametros(nodo):
    resueltos = []
    for p in (nodo or {}).get("parameters", []):
        resueltos.append(resolver(p["$ref"]) if "$ref" in p else p)
    return [p for p in resueltos if p]


operaciones = 0
for ruta, item in spec.get("paths", {}).items():
    en_ruta = {p["name"] for p in parametros(item) if p.get("in") == "path"}
    for metodo, op in item.items():
        if metodo not in METODOS:
            continue
        operaciones += 1
        etiqueta = f"{metodo.upper()} {ruta}"
        if not op.get("responses"):
            errores.append(f"{etiqueta}: sin responses")
        for tag in op.get("tags", []):
            if tag not in tags_declarados:
                errores.append(f"{etiqueta}: tag no declarado -> {tag}")
        declarados = en_ruta | {p["name"] for p in parametros(op) if p.get("in") == "path"}
        for nombre in re.findall(r"{([^}]+)}", ruta):
            if nombre not in declarados:
                errores.append(f"{etiqueta}: parámetro de ruta sin declarar -> {nombre}")

if errores:
    print(f"{RUTA}: {len(errores)} problema(s)")
    for e in errores:
        print(f"  - {e}")
    sys.exit(1)

print(f"{RUTA} válido: {len(spec['paths'])} rutas, {operaciones} operaciones.")
