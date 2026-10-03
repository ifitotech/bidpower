#!/usr/bin/env python3
"""Turns data/bidpower_materials.csv into the compact standard catalog the app searches (src/lib/catalog/materials.json).
Run again whenever the CSV is updated:  python3 scripts/build-catalog.py
Columns used: id, category, subcategory, name, short_description, unit, keywords (JSON list)."""
import csv, json, re, sys, collections

SRC = "data/bidpower_materials.csv"
OUT = "src/lib/catalog/materials.json"

# The CSV has finer categories than the app: map them to the app's ten.
def app_category(cat, sub, name):
    if cat in ("Boxes", "Conduit", "Wire", "Devices", "Lighting", "Fittings"): return cat.lower()
    if cat in ("Supports", "Hardware", "Connectors"): return "fittings"
    if cat == "Consumables": return "other"
    if cat == "Controls": return "gear"
    if cat == "Grounding": return "wire" if sub == "Bare Copper" else "fittings"
    if cat == "Low Voltage": return "devices" if sub == "Data Devices" else "wire"
    if cat == "Distribution":
        if "Breakers" in sub: return "breakers"
        if sub in ("Single Phase Panels", "Three Phase Panelboards", "Meter Sockets", "Safety Switches", "AC Disconnects"): return "panels"
        return "gear"
    return "other"

UNIT = {"RL": "ROLL", "BX": "BOX", "EA": "EA", "FT": "FT"}
BRANDS = [("Square D", r"^Square D "), ("Eaton", r"^Eaton "), ("Siemens", r"^Siemens ")]
GENERIC = {"wire", "cable", "fittings", "boxes", "devices", "hardware", "supports", "distribution", "connectors", "conduit", "lighting", "controls", "consumables", "low voltage", "grounding"}

# Spanish words the field uses, added per subcategory when the CSV's own keywords do not already carry one.
ES = {
    "Mud Rings": ["anillo", "aro", "anillo de yeso"], "Wall Plates": ["placa", "tapa"], "Receptacles": ["tomacorriente", "enchufe"],
    "Switches": ["apagador", "interruptor"], "Dimmers": ["regulador de luz", "dimmer"], "Weatherproof Covers": ["tapa intemperie", "tapa exterior"],
    "Junction / Pull Boxes": ["caja de paso", "caja de registro"], "Square Steel Boxes": ["caja cuadrada"], "Device Boxes": ["caja de aparato", "caja de apagador"],
    "Steel Box Covers": ["tapa de caja"], "Weatherproof Boxes": ["caja intemperie"], "Masonry Boxes": ["caja de block"], "Handy Boxes": ["caja handy"],
    "Ceiling Boxes": ["caja de techo"], "Conduit Bodies": ["condulet", "cuerpo de conduit"], "Reducers": ["reductor", "reduccion"], "Threaded Nipples": ["niple"],
    "Conduit Elbows": ["codo"], "Conduit Straps": ["abrazadera", "grapa"], "Strut Clamps": ["abrazadera strut", "clamp strut"], "Rod Hardware": ["varilla roscada", "tornilleria"],
    "Threaded Rod": ["varilla roscada"], "Strut Channel": ["canal strut", "unistrut"], "Screws": ["tornillo"], "Anchors": ["ancla", "taquete"],
    "Compression Lugs": ["zapata", "terminal"], "Split Bolts": ["conector split bolt", "tornillo partido"], "Twist-On Connectors": ["conector wirenut", "capuchon"],
    "Lever Connectors": ["conector palanca"], "Insulated Multi-Tap": ["conector multiple", "bloque"], "Thermal Magnetic Breakers": ["breaker", "interruptor termomagnetico", "pastilla"],
    "Protected Breakers": ["breaker", "interruptor protegido"], "Safety Switches": ["desconectador", "interruptor de seguridad"], "Fuses": ["fusible"],
    "Single Phase Panels": ["panel", "tablero", "centro de carga"], "Three Phase Panelboards": ["panel trifasico", "tablero trifasico"], "Meter Sockets": ["base de medidor", "caja de medidor"],
    "Cable Ties": ["cincho", "cinta plastica"], "Electrical Tape": ["cinta aislante", "cinta electrica"], "Pulling Line": ["soga", "guia"], "Firestop": ["sellador contra fuego"],
    "Installation Supplies": ["insumos"], "Photocells": ["fotocelda", "fotocelula"], "Timers": ["temporizador", "timer"], "Wall Sensors": ["sensor de pared", "sensor de presencia"],
    "Ceiling Sensors": ["sensor de techo", "sensor de presencia"], "Lighting Contactors": ["contactor de iluminacion"], "Bare Copper": ["cobre desnudo", "tierra desnuda"],
    "Ground Clamps": ["abrazadera de tierra"], "Ground Rods": ["varilla de tierra", "varilla copperweld"], "Data Cable": ["cable de red", "cable de datos"], "Data Devices": ["jack de red", "conector de red"],
    "Fire Alarm Cable": ["cable alarma de incendio"], "Flexible Cord": ["cordon", "extension"], "Flexible Conduit": ["flex", "tubo flexible", "greenfield"],
    "EMT": ["tubo emt"], "PVC": ["tubo pvc"], "Rigid / IMC": ["tubo rigido"], "Cable Connectors": ["conector de cable"], "Commercial Interior": ["luminaria comercial"],
    "Commercial Fixtures": ["luminaria comercial"], "Residential Interior": ["luminaria residencial"], "Life Safety": ["luz de emergencia", "salida"],
}

def clean_aliases(r, name):
    kws = json.loads(r["keywords"]) if r["keywords"].strip() else []
    sub = r["subcategory"]
    out, seen = [], {name.lower()}
    for k in kws + ES.get(sub, []):
        k = k.strip().lower()
        if not k or k in seen or k in GENERIC or k == sub.lower() and len(k.split()) == 1: continue
        seen.add(k); out.append(k)
    return out[:12]

rows = list(csv.DictReader(open(SRC, encoding="utf-8")))
items, seen_ids = [], set()
for r in rows:
    if r["active"].strip().lower() != "true": continue
    name = r["name"].strip()
    if not name or r["id"] in seen_ids: continue
    seen_ids.add(r["id"])
    brand = next((b for b, pat in BRANDS if re.match(pat, name)), None)
    item = {"i": r["id"], "n": name[:300], "u": UNIT.get(r["unit"].strip().upper(), "EA"), "c": app_category(r["category"], r["subcategory"], name), "a": clean_aliases(r, name)}
    sd = r["short_description"].strip()
    if sd and sd.lower() not in [a for a in item["a"]] and sd.lower() != name.lower() and len(item["a"]) < 12: item["a"].append(sd.lower())
    if brand: item["m"] = brand
    items.append(item)

json.dump(items, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
cats = collections.Counter(i["c"] for i in items)
print(len(items), "items ->", OUT, dict(cats))
