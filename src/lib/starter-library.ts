// Standard electrical materials, described the way the trade orders them. Generic on purpose: no brands, no manufacturer part
// numbers and no prices (those come from the company's own suppliers). Sizes, gauges and ratings are industry standards.
// Each company copies this into its own library with one tap; nothing here is shared or edited globally.
import type { ImportRow } from "@/lib/material-import";

type Cat = "conduit" | "wire" | "boxes" | "fittings" | "devices" | "breakers" | "panels" | "lighting" | "gear" | "other";
type Unit = "EA" | "FT" | "ROLL" | "BOX" | "BAG" | "SET" | "PAIR" | "LOT" | "CT" | "PKG";

const out: ImportRow[] = [];
const add = (description: string, unit: Unit, category: Cat, aliases: string[] = []) =>
  out.push({ quantity: null, description, catalog_number: null, manufacturer: null, unit, category, aliases });

// ---- Wire --------------------------------------------------------------------------------------------------------
const COLORS: [string, string[]][] = [
  ["black", ["negro", "blk"]], ["red", ["rojo"]], ["blue", ["azul"]], ["white", ["blanco", "wht"]], ["green", ["verde", "grn"]],
  ["gray", ["gris", "grey"]], ["orange", ["naranja"]], ["yellow", ["amarillo"]], ["brown", ["cafe", "marron"]],
];
const SMALL_COLORS = COLORS.slice(0, 5);
const AWG_SMALL = ["14", "12", "10"];
const AWG_ALL = ["14", "12", "10", "8", "6", "4", "3", "2", "1", "1/0", "2/0", "3/0", "4/0"];

for (const size of AWG_ALL) {
  const solid = AWG_SMALL.includes(size);
  const colors = ["14", "12", "10", "8"].includes(size) ? COLORS : SMALL_COLORS;
  for (const [color, names] of colors) {
    const tag = `#${size}`;
    if (solid) add(`THHN ${size} AWG solid ${color}`, "FT", "wire", [`${tag} ${color} solid`, `cable ${size} ${names[0]} solido`, `thhn ${size} ${names[names.length - 1]} sol`]);
    add(`THHN ${size} AWG stranded ${color}`, "FT", "wire", [`${tag} ${color}`, `cable ${size} ${names[0]}`, `thhn ${size} ${names[names.length - 1]}`, `thhn ${size} str ${color}`]);
  }
}
for (const size of ["14", "12", "10", "8", "6"]) {
  add(`Bare copper ground ${size} AWG solid`, "FT", "wire", [`tierra desnuda ${size}`, `bare ground ${size}`]);
}
for (const size of ["8", "6", "4", "2", "1/0", "2/0", "4/0"]) add(`Bare copper ground ${size} AWG stranded`, "FT", "wire", [`tierra desnuda ${size}`, `bare ground ${size}`]);
for (const size of ["14", "12", "10"]) add(`Green insulated ground ${size} AWG stranded`, "FT", "wire", [`tierra verde ${size}`, `green ground ${size}`]);

for (const size of ["14", "12", "10", "8", "6"]) {
  for (const cond of ["2", "3"]) {
    add(`NM-B cable ${size}/${cond} with ground`, "FT", "wire", [`romex ${size}/${cond}`, `nm-b ${size}-${cond}`, `${size}/${cond} romex`, `cable romex ${size}/${cond}`]);
    add(`UF-B cable ${size}/${cond} with ground`, "FT", "wire", [`uf ${size}/${cond}`, `cable subterraneo ${size}/${cond}`, `direct burial ${size}/${cond}`]);
  }
}
for (const size of ["14", "12", "10", "8", "6"]) {
  add(`MC cable ${size}/2 with ground`, "FT", "wire", [`mc ${size}/2`, `bx ${size}/2`, `armored cable ${size}/2`, `cable mc ${size}/2`]);
  add(`MC cable ${size}/3 with ground`, "FT", "wire", [`mc ${size}/3`, `bx ${size}/3`, `armored cable ${size}/3`, `cable mc ${size}/3`]);
}
for (const size of ["4", "2", "1/0", "2/0", "4/0"]) {
  add(`SER cable ${size}-${size}-${size}-${size === "4" ? "6" : size === "2" ? "4" : size === "1/0" ? "2" : size === "2/0" ? "1" : "2"} aluminum`, "FT", "wire", [`ser ${size}`, `service entrance cable ${size}`]);
  add(`THHN ${size} AWG aluminum stranded black`, "FT", "wire", [`aluminio ${size}`, `aluminum ${size}`, `xhhw ${size} al`]);
}
for (const size of ["14", "12"]) add(`SO cord ${size}/3 flexible`, "FT", "wire", [`extension cord ${size}/3`, `cordon ${size}/3`]);
for (const cat of ["Cat5e", "Cat6", "Cat6A"]) {
  add(`${cat} cable 4-pair CMR`, "FT", "wire", [`${cat.toLowerCase()} riser`, `cable de red ${cat.toLowerCase()}`, `ethernet ${cat.toLowerCase()}`]);
  add(`${cat} cable 4-pair plenum CMP`, "FT", "wire", [`${cat.toLowerCase()} plenum`]);
}
add("Coax RG6 quad shield", "FT", "wire", ["rg6", "coaxial rg6"]);
add("Speaker wire 16/2", "FT", "wire", ["cable bocina 16/2"]);
add("Speaker wire 14/2", "FT", "wire", ["cable bocina 14/2"]);
add("Thermostat wire 18/5", "FT", "wire", ["thermostat 18-5", "cable termostato 18/5"]);
add("Thermostat wire 18/2", "FT", "wire", ["thermostat 18-2"]);
add("Low-voltage landscape cable 12/2", "FT", "wire", ["cable jardin 12/2"]);
add("Fire alarm cable FPLR 18/2", "FT", "wire", ["fpl 18/2", "alarma de incendio 18/2"]);
add("Fire alarm cable FPLR 16/2", "FT", "wire", ["fpl 16/2"]);

// ---- Conduit and fittings -----------------------------------------------------------------------------------------
const TRADE = ["1/2", "3/4", "1", "1-1/4", "1-1/2", "2", "2-1/2", "3", "3-1/2", "4"];
const TRADE_SMALL = ["1/2", "3/4", "1", "1-1/4", "1-1/2", "2"];

for (const s of TRADE) {
  add(`EMT conduit ${s} in`, "FT", "conduit", [`emt ${s}`, `tubo emt ${s}`, `${s} emt`]);
  add(`EMT set-screw connector ${s} in`, "EA", "fittings", [`emt connector ${s}`, `conector emt ${s}`, `${s} emt conn`]);
  add(`EMT set-screw coupling ${s} in`, "EA", "fittings", [`emt coupling ${s}`, `cople emt ${s}`, `union emt ${s}`]);
  add(`EMT compression connector ${s} in`, "EA", "fittings", [`emt comp connector ${s}`, `conector compresion emt ${s}`]);
  add(`EMT compression coupling ${s} in`, "EA", "fittings", [`emt comp coupling ${s}`, `cople compresion emt ${s}`]);
  add(`EMT 90 degree elbow ${s} in`, "EA", "conduit", [`emt 90 ${s}`, `codo emt ${s}`, `emt ell ${s}`]);
  add(`EMT 1-hole strap ${s} in`, "EA", "fittings", [`strap emt ${s}`, `abrazadera emt ${s}`, `one hole strap ${s}`]);
  add(`EMT 2-hole strap ${s} in`, "EA", "fittings", [`two hole strap ${s}`, `abrazadera 2 huecos ${s}`]);
  add(`Rigid (RMC) conduit ${s} in`, "FT", "conduit", [`rigid ${s}`, `rmc ${s}`, `tubo rigido ${s}`, `galvanized rigid ${s}`]);
  add(`Rigid conduit coupling ${s} in`, "EA", "fittings", [`rigid coupling ${s}`, `cople rigido ${s}`]);
  add(`Rigid conduit 90 degree elbow ${s} in`, "EA", "conduit", [`rigid 90 ${s}`, `codo rigido ${s}`]);
  add(`Locknut ${s} in`, "EA", "fittings", [`lock nut ${s}`, `tuerca ${s}`, `contratuerca ${s}`]);
  add(`Insulated bushing ${s} in`, "EA", "fittings", [`bushing ${s}`, `bushing aislado ${s}`, `plastic bushing ${s}`]);
  add(`Grounding bushing ${s} in`, "EA", "fittings", [`ground bushing ${s}`]);
  add(`Rigid threaded hub ${s} in`, "EA", "fittings", [`myers hub ${s}`, `hub ${s}`]);
  add(`PVC Schedule 40 conduit ${s} in`, "FT", "conduit", [`pvc ${s}`, `tubo pvc ${s}`, `pvc sch 40 ${s}`, `conduit pvc ${s}`]);
  add(`PVC Schedule 80 conduit ${s} in`, "FT", "conduit", [`pvc 80 ${s}`, `pvc sch 80 ${s}`]);
  add(`PVC coupling ${s} in`, "EA", "fittings", [`pvc cople ${s}`, `pvc union ${s}`]);
  add(`PVC male adapter ${s} in`, "EA", "fittings", [`pvc terminal adapter ${s}`, `pvc ta ${s}`, `adaptador macho pvc ${s}`]);
  add(`PVC female adapter ${s} in`, "EA", "fittings", [`pvc fa ${s}`, `adaptador hembra pvc ${s}`]);
  add(`PVC 90 degree elbow ${s} in`, "EA", "conduit", [`pvc 90 ${s}`, `codo pvc ${s}`, `pvc ell ${s}`]);
  add(`PVC 45 degree elbow ${s} in`, "EA", "conduit", [`pvc 45 ${s}`, `codo pvc 45 ${s}`]);
  add(`PVC end bell ${s} in`, "EA", "fittings", [`pvc bell end ${s}`, `terminal campana pvc ${s}`]);
  add(`Conduit expansion fitting ${s} in`, "EA", "fittings", [`expansion joint ${s}`, `junta expansion ${s}`]);
}
for (const s of ["1/2", "3/4", "1", "1-1/4", "1-1/2", "2", "2-1/2", "3", "4"]) {
  add(`IMC conduit ${s} in`, "FT", "conduit", [`imc ${s}`, `intermediate metal conduit ${s}`]);
}
for (const s of ["3/8", "1/2", "3/4", "1", "1-1/4", "1-1/2", "2"]) {
  add(`Flexible metal conduit (FMC) ${s} in`, "FT", "conduit", [`greenfield ${s}`, `flex ${s}`, `fmc ${s}`, `flexible ${s}`]);
  add(`FMC squeeze connector straight ${s} in`, "EA", "fittings", [`flex connector ${s}`, `greenfield connector ${s}`, `conector flex ${s}`]);
  add(`FMC squeeze connector 90 degree ${s} in`, "EA", "fittings", [`flex connector 90 ${s}`, `conector flex 90 ${s}`]);
}
for (const s of TRADE_SMALL.concat(["2-1/2", "3", "4"])) {
  add(`Liquidtight flexible conduit (LFMC) ${s} in`, "FT", "conduit", [`liquid tight ${s}`, `sealtite ${s}`, `lfmc ${s}`, `liquidtight ${s}`, `flex liquido ${s}`]);
  add(`Liquidtight connector straight ${s} in`, "EA", "fittings", [`sealtite connector ${s}`, `liquidtight connector ${s}`, `conector liquidtight ${s}`]);
  add(`Liquidtight connector 90 degree ${s} in`, "EA", "fittings", [`sealtite connector 90 ${s}`, `liquidtight 90 ${s}`]);
}
for (const s of ["1/2", "3/4", "1", "1-1/4", "1-1/2", "2"]) {
  add(`ENT flexible nonmetallic conduit ${s} in`, "FT", "conduit", [`smurf tube ${s}`, `ent ${s}`, `blue flex ${s}`]);
  add(`Conduit body LB ${s} in`, "EA", "fittings", [`lb ${s}`, `condulet lb ${s}`]);
  add(`Conduit body LL ${s} in`, "EA", "fittings", [`ll ${s}`]);
  add(`Conduit body LR ${s} in`, "EA", "fittings", [`lr ${s}`]);
  add(`Conduit body T ${s} in`, "EA", "fittings", [`condulet t ${s}`]);
  add(`Conduit body C ${s} in`, "EA", "fittings", [`condulet c ${s}`]);
  add(`Conduit nipple ${s} in x close`, "EA", "fittings", [`nipple ${s}`, `niple ${s}`]);
  add(`Conduit seal-off fitting ${s} in`, "EA", "fittings", [`eys ${s}`, `seal off ${s}`]);
}
for (const s of ["1/2", "3/4", "1"]) {
  add(`Rigid threaded rod hanger ${s} in`, "EA", "fittings", [`conduit hanger ${s}`, `clevis hanger ${s}`, `colgante ${s}`]);
  add(`Conduit clamp (one-hole, rigid) ${s} in`, "EA", "fittings", [`rigid strap ${s}`]);
  add(`Beam clamp conduit ${s} in`, "EA", "fittings", [`beam clamp ${s}`]);
}
add("Wire mesh cable pulling grip", "EA", "other", ["kellems grip", "malla de jalar"]);
add("Pull string polyester 1250 lb", "ROLL", "other", ["pull line", "mule tape", "jalador"]);
add("Wire pulling lubricant 1 gal", "EA", "other", ["pulling lube", "lubricante cable", "wire lube"]);
add("Fish tape 100 ft", "EA", "other", ["fish tape 100", "guia 100"]);
add("Conduit pull rope 200 ft", "ROLL", "other", ["rope 200", "soga jalar"]);

// ---- Boxes and covers ---------------------------------------------------------------------------------------------
const BOXES: [string, string[], Unit][] = [
  ["Single-gang new-work plastic box", ["1g nm box", "caja 1 gang plastica", "single gang box", "old work box"], "EA"],
  ["Single-gang old-work plastic box", ["1g old work", "caja existente 1 gang"], "EA"],
  ["Two-gang new-work plastic box", ["2g box", "caja 2 gang"], "EA"],
  ["Two-gang old-work plastic box", ["2g old work"], "EA"],
  ["Three-gang plastic box", ["3g box"], "EA"],
  ["Four-gang plastic box", ["4g box"], "EA"],
  ["Single-gang metal switch box 2-1/2 in deep", ["1g metal box", "gem box", "switch box 2 1/2", "caja metalica 1 gang"], "EA"],
  ["Single-gang metal switch box 3-1/2 in deep", ["1g metal 3 1/2", "deep switch box"], "EA"],
  ["Two-gang metal switch box", ["2g metal box", "gem box 2 gang"], "EA"],
  ["Three-gang metal switch box", ["3g metal box"], "EA"],
  ["Four-gang metal switch box", ["4g metal box"], "EA"],
  ["4 in square box 1-1/2 in deep", ["4 square 1 1/2", "caja cuadrada 4", "4s box", "4x4 box 1 1/2"], "EA"],
  ["4 in square box 2-1/8 in deep", ["4 square deep", "4 square 2 1/8", "4s deep", "4x4 box 2 1/8"], "EA"],
  ["4-11/16 in square box 2-1/8 in deep", ["4 11/16", "411 box", "big square box"], "EA"],
  ["4 in octagon box 1-1/2 in deep", ["4 octagon", "octagon box", "caja octagonal"], "EA"],
  ["4 in octagon box 2-1/8 in deep", ["4 octagon deep"], "EA"],
  ["Round ceiling box plastic 4 in", ["round box", "caja redonda", "pancake box"], "EA"],
  ["Ceiling fan-rated box", ["fan box", "caja ventilador", "fan rated box"], "EA"],
  ["Remodel fan brace bar", ["fan brace", "brace ventilador"], "EA"],
  ["Weatherproof box single-gang", ["wp box 1g", "caja intemperie 1 gang", "bell box"], "EA"],
  ["Weatherproof box two-gang", ["wp box 2g", "bell box 2g"], "EA"],
  ["Extension ring 4 in square", ["4 square extension ring", "extension ring"], "EA"],
  ["Pop-up floor box", ["floor box", "caja piso"], "EA"],
  ["Retrofit ceiling box with bracket", ["pancake box", "retrofit ceiling box"], "EA"],
  ["PVC junction box 4x4", ["pvc box 4x4"], "EA"],
  ["Cut-in box support bracket", ["box support", "bar hanger box"], "EA"],
];
for (const [d, a, u] of BOXES) add(d, u, "boxes", a);
for (const h of ["raised 1/2 in", "raised 5/8 in", "raised 3/4 in", "flat"]) {
  add(`Mud ring 4 in square single-gang ${h}`, "EA", "boxes", [`mud ring ${h}`, `plaster ring ${h}`, `anillo ${h}`]);
  add(`Mud ring 4 in square two-gang ${h}`, "EA", "boxes", [`mud ring 2g ${h}`, `plaster ring 2g ${h}`]);
}
add("Blank cover 4 in square", "EA", "boxes", ["blank cover 4 square", "tapa ciega 4"]);
add("Blank cover 4 in octagon", "EA", "boxes", ["blank cover octagon"]);
add("Blank cover 4-11/16 in square", "EA", "boxes", ["blank cover 411"]);
add("Fixture hanger bar 24 in", "EA", "boxes", ["bar hanger 24", "bar hanger", "hanger bar"]);
add("Fixture stud 3/8 in x 3/8 in", "EA", "boxes", ["fixture stud", "stud 3/8"]);
for (const pb of ["6x6x4", "8x8x4", "12x12x4", "12x12x6", "16x16x6", "18x18x8", "24x24x8", "24x24x12", "36x36x12"]) {
  add(`Pull box NEMA 1 ${pb} in`, "EA", "boxes", [`pull box ${pb}`, `caja de paso ${pb}`, `junction box ${pb}`]);
  add(`Pull box NEMA 3R ${pb} in`, "EA", "boxes", [`pull box 3r ${pb}`, `pull box outdoor ${pb}`]);
}
for (const pb of ["6x6x4", "8x8x4", "12x12x6", "16x16x6"]) add(`Pull box NEMA 4X stainless ${pb} in`, "EA", "boxes", [`4x box ${pb}`, `stainless junction box ${pb}`]);
for (const wp of ["1/2", "3/4", "1"]) add(`Weatherproof round box with hubs ${wp} in`, "EA", "boxes", [`wp round box ${wp}`]);

// ---- Devices and plates -------------------------------------------------------------------------------------------
const DEV_COLORS = ["white", "ivory", "light almond", "black", "gray", "brown"];
for (const amps of ["15", "20"]) {
  add(`Duplex receptacle ${amps}A 125V`, "EA", "devices", [`outlet ${amps}a`, `tomacorriente ${amps}`, `receptacle ${amps}`, `duplex ${amps}`, `plug ${amps}`]);
  add(`Tamper-resistant duplex receptacle ${amps}A 125V`, "EA", "devices", [`tr receptacle ${amps}`, `tr outlet ${amps}`, `tamper resistant ${amps}`]);
  add(`GFCI receptacle ${amps}A 125V tamper-resistant`, "EA", "devices", [`gfci ${amps}`, `gfi ${amps}`, `gfci outlet ${amps}`]);
  add(`Weather-resistant GFCI receptacle ${amps}A 125V`, "EA", "devices", [`wr gfci ${amps}`, `gfci exterior ${amps}`]);
  add(`Weather-resistant tamper-resistant receptacle ${amps}A`, "EA", "devices", [`wr tr ${amps}`, `wrtr ${amps}`]);
  add(`Single receptacle ${amps}A 125V`, "EA", "devices", [`single outlet ${amps}`, `simple ${amps}`]);
  add(`Switch single-pole ${amps}A 120/277V`, "EA", "devices", [`sp switch ${amps}`, `switch 1p ${amps}`, `apagador ${amps}`, `interruptor ${amps}`]);
  add(`Switch 3-way ${amps}A 120/277V`, "EA", "devices", [`3 way switch ${amps}`, `three way ${amps}`, `apagador 3 vias ${amps}`]);
  add(`Switch 4-way ${amps}A 120/277V`, "EA", "devices", [`4 way switch ${amps}`, `four way ${amps}`]);
  add(`Switch double-pole ${amps}A 120/277V`, "EA", "devices", [`dp switch ${amps}`, `2 pole switch ${amps}`]);
  add(`Decora paddle switch single-pole ${amps}A`, "EA", "devices", [`decora switch ${amps}`, `rocker switch ${amps}`]);
  add(`Decora paddle switch 3-way ${amps}A`, "EA", "devices", [`decora 3 way ${amps}`]);
  add(`Illuminated switch single-pole ${amps}A`, "EA", "devices", [`lighted switch ${amps}`]);
  add(`Receptacle with USB-A/C charger ${amps}A`, "EA", "devices", [`usb outlet ${amps}`, `usb receptacle ${amps}`]);
}
add("Dimmer single-pole LED 600W", "EA", "devices", ["led dimmer", "dimmer 600w", "dimmer led"]);
add("Dimmer 3-way LED 600W", "EA", "devices", ["dimmer 3 way", "dimmer 3 vias"]);
add("Occupancy sensor wall switch 1000W", "EA", "devices", ["occupancy switch", "motion switch", "sensor de presencia"]);
add("Vacancy sensor wall switch", "EA", "devices", ["vacancy switch"]);
add("Timer switch in-wall 15 min", "EA", "devices", ["timer switch", "timer pared"]);
add("Fan speed control switch", "EA", "devices", ["fan control", "control ventilador"]);
add("Photocell dusk-to-dawn 120V", "EA", "devices", ["photocell", "fotocelda", "eye"]);
add("Combination switch and receptacle", "EA", "devices", ["switch outlet combo"]);
add("Combination two switches", "EA", "devices", ["double switch", "dos apagadores"]);
add("Pilot light receptacle", "EA", "devices", ["pilot light outlet"]);
add("Receptacle dryer NEMA 14-30R 30A 125/250V", "EA", "devices", ["dryer outlet", "14-30r", "tomacorriente secadora"]);
add("Receptacle range NEMA 14-50R 50A 125/250V", "EA", "devices", ["range outlet", "14-50r", "ev outlet", "estufa tomacorriente", "welder outlet"]);
add("Receptacle NEMA 6-20R 20A 250V", "EA", "devices", ["6-20r", "250v outlet"]);
add("Receptacle NEMA 6-50R 50A 250V", "EA", "devices", ["6-50r", "welder receptacle"]);
add("Receptacle NEMA 10-30R 30A 125/250V", "EA", "devices", ["10-30r"]);
add("Surface mounted dryer outlet box 14-30", "EA", "devices", ["dryer box"]);
add("Twist-lock receptacle L5-20R 20A", "EA", "devices", ["l5-20r", "twistlock 20"]);
add("Twist-lock receptacle L5-30R 30A", "EA", "devices", ["l5-30r", "twistlock 30"]);
add("Twist-lock receptacle L14-30R 30A 125/250V", "EA", "devices", ["l14-30r", "generator receptacle"]);
add("Twist-lock plug L14-30P 30A", "EA", "devices", ["l14-30p", "generator plug"]);
add("Power inlet L14-30P 30A", "EA", "devices", ["generator inlet", "inlet l14-30"]);
add("Power inlet box 50A weatherproof", "EA", "devices", ["inlet box 50a", "generator inlet 50"]);
add("Surge protective receptacle 15A", "EA", "devices", ["surge outlet"]);
add("Telephone jack RJ11 wall plate insert", "EA", "devices", ["rj11", "jack telefono"]);
add("Cat6 keystone jack", "EA", "devices", ["cat6 jack", "rj45 jack", "keystone cat6"]);
add("RJ45 Cat6 connector", "EA", "devices", ["rj45", "cat6 plug", "conector rj45"]);
add("Coax F-type wall plate insert", "EA", "devices", ["coax jack", "tv jack"]);
add("Smoke alarm hardwired with battery backup", "EA", "devices", ["smoke detector hardwired", "detector humo"]);
add("Carbon monoxide alarm hardwired", "EA", "devices", ["co detector", "detector monoxido"]);
add("Combination smoke/CO alarm hardwired", "EA", "devices", ["smoke co combo"]);
add("Doorbell transformer 16V 10VA", "EA", "devices", ["doorbell transformer", "transformador timbre"]);
add("Doorbell button", "EA", "devices", ["timbre boton"]);
add("Chime kit doorbell", "EA", "devices", ["door chime", "campana"]);
for (const [plate, names] of [["Single-gang duplex receptacle wall plate", ["outlet cover", "duplex plate", "tapa tomacorriente"]], ["Single-gang toggle switch wall plate", ["switch plate", "toggle plate", "tapa apagador"]], ["Single-gang decora wall plate", ["decora plate", "decora cover"]], ["Single-gang blank wall plate", ["blank plate", "tapa ciega"]], ["Two-gang duplex receptacle wall plate", ["2 gang outlet plate"]], ["Two-gang toggle wall plate", ["2 gang toggle plate"]], ["Two-gang decora wall plate", ["2 gang decora plate"]], ["Two-gang blank wall plate", ["2 gang blank plate"]], ["Three-gang decora wall plate", ["3 gang decora plate"]], ["Three-gang toggle wall plate", ["3 gang toggle plate"]]] as [string, string[]][]) {
  for (const color of DEV_COLORS.slice(0, 4)) add(`${plate} ${color}`, "EA", "devices", names.map((n) => `${n} ${color}`));
}
add("Weatherproof in-use cover single-gang horizontal", "EA", "devices", ["in use cover", "bubble cover", "tapa intemperie"]);
add("Weatherproof in-use cover single-gang vertical", "EA", "devices", ["in use cover vertical"]);
add("Weatherproof cover single-gang flip", "EA", "devices", ["wp flip cover"]);
add("Weatherproof cover two-gang in-use", "EA", "devices", ["in use cover 2 gang"]);
add("Switch cover weatherproof toggle", "EA", "devices", ["wp switch cover"]);

// ---- Breakers and panels ------------------------------------------------------------------------------------------
for (const a of ["15", "20", "30", "40", "50"]) add(`Circuit breaker 1-pole ${a}A plug-on 120/240V`, "EA", "breakers", [`${a}a breaker`, `breaker ${a}`, `1p ${a}`, `breaker 1 polo ${a}`, `${a} amp breaker`, `${a}a 1p`]);
for (const a of ["15", "20", "30", "40", "50", "60", "70", "80", "90", "100", "125"]) add(`Circuit breaker 2-pole ${a}A plug-on 120/240V`, "EA", "breakers", [`${a}a 2p breaker`, `2p ${a}`, `breaker 2 polos ${a}`, `${a} amp double pole`, `${a}a 2p`]);
for (const a of ["15", "20", "30", "40", "50", "60", "70", "90", "100"]) add(`Circuit breaker 3-pole ${a}A plug-on 240V`, "EA", "breakers", [`${a}a 3p breaker`, `3p ${a}`, `breaker 3 polos ${a}`, `${a}a 3p`]);
for (const a of ["15", "20"]) {
  add(`AFCI breaker 1-pole ${a}A`, "EA", "breakers", [`afci ${a}`, `arc fault ${a}`, `afci breaker ${a}`]);
  add(`GFCI breaker 1-pole ${a}A`, "EA", "breakers", [`gfci breaker ${a}`, `gfi breaker ${a}`]);
  add(`Dual-function AFCI/GFCI breaker 1-pole ${a}A`, "EA", "breakers", [`dual function ${a}`, `afci gfci ${a}`, `dfci ${a}`]);
}
for (const a of ["20", "30", "40", "50", "60"]) {
  add(`GFCI breaker 2-pole ${a}A`, "EA", "breakers", [`gfci 2p ${a}`, `gfci breaker 2 pole ${a}`, `spa breaker ${a}`]);
  add(`AFCI breaker 2-pole ${a}A`, "EA", "breakers", [`afci 2p ${a}`]);
}
add("Tandem breaker 1-pole 15/15A", "EA", "breakers", ["tandem 15", "twin breaker 15", "cheater breaker"]);
add("Tandem breaker 1-pole 20/20A", "EA", "breakers", ["tandem 20", "twin breaker 20"]);
add("Breaker handle tie 2-pole", "EA", "breakers", ["handle tie", "tie bar"]);
add("Breaker lock-off clip", "EA", "breakers", ["breaker lock", "lockout clip"]);
add("Breaker filler plate", "EA", "breakers", ["filler plate", "blank breaker", "breaker blank"]);
add("Surge protective device whole-home panel type 2", "EA", "breakers", ["spd", "whole house surge", "protector sobrevoltaje"]);
add("Surge protective device plug-on breaker type", "EA", "breakers", ["surge breaker", "plug on spd"]);
for (const a of ["70", "100", "125", "150", "200", "225", "400"]) {
  add(`Main breaker ${a}A 2-pole`, "EA", "breakers", [`main ${a}`, `${a}a main breaker`, `breaker principal ${a}`]);
  add(`Molded-case circuit breaker 3-pole ${a}A`, "EA", "breakers", [`${a}a 3p mccb`, `mccb ${a} 3p`]);
}
for (const [a, spaces] of [["100", "12"], ["100", "16"], ["125", "20"], ["150", "30"], ["200", "30"], ["200", "40"], ["225", "42"]] as [string, string][]) {
  add(`Load center ${a}A ${spaces}-space main breaker indoor`, "EA", "panels", [`panel ${a}a ${spaces}`, `${a}a panel`, `panel principal ${a}`, `load center ${a}`, `main breaker panel ${a}`]);
  add(`Load center ${a}A ${spaces}-space main lug indoor`, "EA", "panels", [`main lug panel ${a}`, `subpanel ${a}`, `sub panel ${a}a ${spaces}`, `mlo ${a}`]);
}
for (const [a, spaces] of [["100", "20"], ["200", "40"]] as [string, string][]) add(`Load center ${a}A ${spaces}-space main breaker outdoor NEMA 3R`, "EA", "panels", [`outdoor panel ${a}`, `panel exterior ${a}`]);
for (const a of ["100", "125", "200", "225", "400"]) add(`Meter socket ${a}A single-phase`, "EA", "panels", [`meter base ${a}`, `meter socket ${a}`, `base medidor ${a}`]);
add("Meter main combo 200A 40-space", "EA", "panels", ["meter main", "meter main combo", "meter panel combo"]);
add("Meter main combo 200A 30-space", "EA", "panels", ["meter main 30"]);
add("Meter main combo 100A 16-space", "EA", "panels", ["meter main 100"]);
for (const a of ["30", "60", "100", "200", "400"]) {
  add(`Safety switch disconnect ${a}A 240V fusible NEMA 3R`, "EA", "panels", [`disconnect ${a} fusible`, `fusible disconnect ${a}`]);
  add(`Safety switch disconnect ${a}A 240V non-fusible NEMA 3R`, "EA", "panels", [`disconnect ${a}`, `non fused disconnect ${a}`, `desconectador ${a}`]);
}
for (const a of ["30", "60"]) add(`AC disconnect ${a}A non-fusible pullout`, "EA", "panels", [`ac disconnect ${a}`, `pullout ${a}`, `hvac disconnect ${a}`]);
for (const sp of ["4", "6", "8", "12", "20"]) add(`Subpanel ${sp}-circuit indoor`, "EA", "panels", [`small panel ${sp}`, `mini panel ${sp}`]);
add("Whole-home generator transfer switch 200A", "EA", "panels", ["ats 200", "transfer switch 200", "generator transfer"]);
add("Manual transfer switch 10-circuit", "EA", "panels", ["manual transfer 10", "interlock transfer"]);
add("Generator interlock kit", "EA", "panels", ["interlock", "interlock kit"]);
add("Grounding electrode ground rod 5/8 in x 8 ft", "EA", "other", ["ground rod", "varilla tierra", "copper rod 8"]);
add("Ground rod 5/8 in x 10 ft", "EA", "other", ["ground rod 10"]);
add("Acorn ground rod clamp", "EA", "fittings", ["acorn clamp", "ground clamp rod", "abrazadera varilla"]);
add("Water pipe ground clamp", "EA", "fittings", ["water ground clamp", "abrazadera agua"]);
add("Panel neutral bar", "EA", "panels", ["neutral bar", "barra neutro"]);
add("Panel ground bar", "EA", "panels", ["ground bar", "barra tierra"]);
add("Panel directory label", "EA", "other", ["panel labels"]);
add("Panel cover", "EA", "panels", ["panel front", "tapa panel"]);
add("Antioxidant compound 8 oz", "EA", "other", ["alox", "noalox", "penetrox", "antioxidant"]);

// ---- Wire connectors and hardware ---------------------------------------------------------------------------------
for (const [name, aliases] of [["Wire nut yellow 18-12 AWG", ["wirenut yellow", "wire connector yellow", "conector amarillo"]], ["Wire nut red 22-8 AWG", ["wirenut red", "conector rojo"]], ["Wire nut orange 22-14 AWG", ["wirenut orange", "conector naranja"]], ["Wire nut gray 22-14 AWG", ["wirenut gray"]], ["Wire nut blue 14-10 AWG", ["wirenut blue"]], ["Wire nut tan 22-14 AWG", ["wirenut tan"]], ["Wire nut green grounding", ["green wire nut", "tierra wirenut"]]] as [string, string[]][]) add(name, "BAG", "fittings", aliases);
add("Lever connector 2-port 12-24 AWG", "BAG", "fittings", ["wago 2", "lever nut 2", "palanca 2"]);
add("Lever connector 3-port 12-24 AWG", "BAG", "fittings", ["wago 3", "lever nut 3", "palanca 3"]);
add("Lever connector 5-port 12-24 AWG", "BAG", "fittings", ["wago 5", "lever nut 5", "palanca 5"]);
add("Splicing connector 221 series 4-conductor", "BAG", "fittings", ["wago 221-414"]);
add("Push-in wire connector 3-port", "BAG", "fittings", ["push in 3", "push wire 3"]);
add("Split bolt connector #6-#2", "EA", "fittings", ["split bolt 6-2", "split bolt small"]);
add("Split bolt connector 1/0-4/0", "EA", "fittings", ["split bolt large", "split bolt 4/0"]);
add("Power distribution block 3-pole 400A", "EA", "fittings", ["distribution block", "pdb", "bloque distribucion"]);
add("Insulated ring terminal 12-10 AWG", "BAG", "fittings", ["ring terminal", "terminal anillo"]);
add("Butt splice 12-10 AWG insulated", "BAG", "fittings", ["butt splice", "empalme"]);
add("Heat-shrink butt connector 12-10 AWG", "BAG", "fittings", ["heat shrink butt"]);
add("Mechanical lug 2/0 aluminum/copper", "EA", "fittings", ["lug 2/0", "terminal 2/0"]);
add("Compression lug 4/0 copper", "EA", "fittings", ["lug 4/0", "terminal 4/0"]);
add("Non-metallic cable staple 1/2 in", "BOX", "fittings", ["romex staple", "grapa romex", "nm staple"]);
add("Non-metallic cable staple 3/4 in", "BOX", "fittings", ["romex staple 3/4"]);
add("Insulated cable staple 14/2", "BOX", "fittings", ["insulated staple", "plastic staple"]);
add("Cable clamp connector NM 3/8 in", "EA", "fittings", ["nm connector", "romex connector", "conector romex"]);
add("Cable clamp connector NM 1/2 in", "EA", "fittings", ["nm connector 1/2", "romex connector 1/2"]);
add("MC cable connector 1/2 in", "EA", "fittings", ["mc connector", "bx connector", "conector mc"]);
add("MC cable connector 3/4 in", "EA", "fittings", ["mc connector 3/4"]);
add("Snap-in MC connector 1/2 in", "EA", "fittings", ["snap in mc", "mc snap"]);
add("Cable strap 1/2 in", "EA", "fittings", ["mc strap", "strap cable"]);
add("Cord grip strain relief 1/2 in", "EA", "fittings", ["liquidtight cord grip", "cord connector"]);
add("Anti-short bushing for MC cable", "BAG", "fittings", ["red head", "redhead", "anti short"]);
add("Rigid strut channel 1-5/8 in x 10 ft", "EA", "fittings", ["unistrut", "strut 10", "strut p1000", "canal strut"]);
add("Strut channel 1-5/8 in half-height 10 ft", "EA", "fittings", ["half strut", "strut 1 5/8 half"]);
add("Strut 1-hole strap 1/2 in", "EA", "fittings", ["strut strap 1/2", "strut clamp 1/2"]);
add("Strut conduit clamp 3/4 in", "EA", "fittings", ["strut clamp 3/4"]);
add("Strut conduit clamp 1 in", "EA", "fittings", ["strut clamp 1"]);
add("Strut spring nut 3/8 in", "EA", "fittings", ["spring nut 3/8", "channel nut"]);
add("Strut spring nut 1/4 in", "EA", "fittings", ["spring nut 1/4"]);
add("Threaded rod 3/8 in x 10 ft", "EA", "fittings", ["all thread 3/8", "varilla roscada 3/8", "threaded rod 3/8"]);
add("Threaded rod 1/4 in x 6 ft", "EA", "fittings", ["all thread 1/4", "threaded rod 1/4"]);
add("Beam clamp 3/8 in rod", "EA", "fittings", ["beam clamp 3/8", "clamp viga"]);
add("Concrete screw 3/16 in x 1-3/4 in", "BOX", "fittings", ["tapcon 3/16 x 1 3/4", "tapcon", "concrete screw"]);
add("Concrete screw 3/16 in x 2-1/4 in", "BOX", "fittings", ["tapcon 3/16 x 2 1/4"]);
add("Wedge anchor 3/8 in x 3 in", "BOX", "fittings", ["wedge anchor", "ancla expansion 3/8"]);
add("Drop-in anchor 3/8 in", "BOX", "fittings", ["drop in anchor", "dropin 3/8"]);
add("Toggle bolt 1/8 in x 3 in", "BOX", "fittings", ["toggle bolt", "tornillo mariposa"]);
add("Plastic wall anchor #8", "BOX", "fittings", ["plastic anchor 8", "taquete 8"]);
add("Sheet metal screw #10 x 3/4 in", "BOX", "fittings", ["self drilling #10", "tek screw", "sheet metal screw 10"]);
add("Pan head self-drilling screw #8 x 1/2 in", "BOX", "fittings", ["tek 8 x 1/2", "self drill 8"]);
add("Drywall screw 1-1/4 in coarse", "BOX", "fittings", ["drywall screw", "tornillo drywall"]);
add("Wood screw #10 x 2 in", "BOX", "fittings", ["wood screw 10 x 2"]);
add("Machine screw 6-32 x 1 in", "BOX", "fittings", ["machine screw 6-32", "device screw"]);
add("Box mounting screw 8-32 x 3/4 in", "BOX", "fittings", ["8-32 screw", "box screws"]);
add("Device mounting screws assortment", "BAG", "fittings", ["receptacle screws"]);
add("Cable tie 8 in 50 lb black", "BAG", "other", ["zip tie 8", "wire tie 8", "cincho 8"]);
add("Cable tie 11 in 50 lb black", "BAG", "other", ["zip tie 11", "wire tie 11", "cincho 11"]);
add("Cable tie 14 in 50 lb black", "BAG", "other", ["zip tie 14", "cincho 14"]);
add("Cable tie 24 in 120 lb black", "BAG", "other", ["zip tie 24", "heavy zip tie"]);
add("Cable tie mount adhesive", "BAG", "other", ["tie mount"]);
add("Hook-and-loop cable strap roll", "ROLL", "other", ["velcro strap", "velcro"]);
add("Electrical tape black 3/4 in", "ROLL", "other", ["black tape", "cinta negra", "tape black", "friction tape"]);
for (const c of ["red", "white", "blue", "green", "yellow", "orange", "gray"]) add(`Electrical tape ${c} 3/4 in`, "ROLL", "other", [`${c} tape`, `cinta ${c}`]);
add("Rubber splicing tape", "ROLL", "other", ["rubber tape", "cinta goma"]);
add("Self-fusing silicone tape", "ROLL", "other", ["self fusing tape", "tape silicone"]);
add("Mastic sealing tape", "ROLL", "other", ["mastic tape"]);
add("Heat-shrink tubing assortment", "PKG", "other", ["heat shrink", "termoencogible"]);
add("Duct seal compound 1 lb", "EA", "other", ["duct seal", "sellador ducto"]);
add("Fire-rated caulk 10 oz", "EA", "other", ["firestop caulk", "fire caulk", "sellador fuego"]);
add("Firestop putty pad", "EA", "other", ["putty pad", "fire putty"]);
add("Firestop sleeve 2 in", "EA", "other", ["firestop sleeve", "fire sleeve"]);
add("Wire labels assortment", "PKG", "other", ["wire markers", "etiquetas cable"]);
add("Panel schedule labels", "PKG", "other", ["circuit labels"]);
add("Conduit paint galvanized spray", "EA", "other", ["cold galvanize spray"]);
add("Cable marking sleeve", "PKG", "other", ["wire sleeve"]);
add("Safety lockout tag", "EA", "other", ["loto tag", "tag lockout"]);
add("Caution tape 3 in x 1000 ft", "ROLL", "other", ["caution tape", "cinta precaucion"]);
add("Underground warning tape 6 in x 1000 ft electric", "ROLL", "other", ["buried tape", "warning tape"]);
add("Nonmetallic rigid conduit PVC cement 8 oz", "EA", "other", ["pvc glue", "pvc cement", "cemento pvc"]);
add("PVC primer purple 8 oz", "EA", "other", ["pvc primer", "primer morado"]);
add("Silicone caulk clear 10 oz", "EA", "other", ["silicone"]);
add("Paintable caulk 10 oz", "EA", "other", ["caulk"]);
add("Spray foam sealant 12 oz", "EA", "other", ["foam spray", "espuma"]);

// ---- Lighting ----------------------------------------------------------------------------------------------------
for (const sz of ["3", "4", "6"]) {
  add(`LED recessed downlight ${sz} in retrofit 120V`, "EA", "lighting", [`can light ${sz}`, `recessed light ${sz}`, `downlight ${sz}`, `led can ${sz}`, `luz empotrada ${sz}`]);
  add(`LED wafer light ${sz} in ultra-thin 120V with junction box`, "EA", "lighting", [`wafer ${sz}`, `slim wafer ${sz}`, `pot light ${sz}`]);
}
add("LED recessed downlight 6 in new construction housing IC rated", "EA", "lighting", ["can housing 6", "new construction can", "housing 6 ic"]);
add("LED recessed downlight 6 in remodel housing IC rated", "EA", "lighting", ["remodel can 6", "old work can"]);
add("LED recessed downlight 4 in new construction housing IC rated", "EA", "lighting", ["can housing 4"]);
add("LED recessed trim baffle 6 in", "EA", "lighting", ["trim 6", "baffle trim 6"]);
add("LED troffer 2x4 4000 lumen 4000K", "EA", "lighting", ["2x4 led", "troffer 2x4", "panel led 2x4", "luminaria 2x4"]);
add("LED troffer 2x2 3000 lumen 4000K", "EA", "lighting", ["2x2 led", "troffer 2x2", "panel led 2x2"]);
add("LED flat panel 1x4", "EA", "lighting", ["1x4 led panel", "panel 1x4"]);
add("LED strip light 4 ft 4000K", "EA", "lighting", ["4ft strip", "strip 4 ft", "shop light 4ft", "lampara 4 pies"]);
add("LED strip light 8 ft 5000K", "EA", "lighting", ["8ft strip", "strip 8 ft", "shop light 8ft"]);
add("LED vapor tight 4 ft 4000K", "EA", "lighting", ["vapor tight 4", "vapor tight led", "lampara hermetica"]);
add("LED vapor tight 8 ft 5000K", "EA", "lighting", ["vapor tight 8"]);
add("LED high bay 150W 5000K", "EA", "lighting", ["high bay 150", "ufo high bay", "campana led 150"]);
add("LED high bay 100W 5000K", "EA", "lighting", ["high bay 100"]);
add("LED linear high bay 4 ft 165W", "EA", "lighting", ["linear high bay", "high bay lineal"]);
add("LED wall pack 30W 5000K", "EA", "lighting", ["wall pack 30", "wallpack", "luz pared exterior"]);
add("LED wall pack 60W 5000K with photocell", "EA", "lighting", ["wall pack 60", "wallpack 60"]);
add("LED flood light 50W 5000K", "EA", "lighting", ["flood 50", "reflector 50"]);
add("LED flood light 100W 5000K", "EA", "lighting", ["flood 100", "reflector 100"]);
add("LED area light 150W 5000K with arm", "EA", "lighting", ["area light", "shoebox light", "shoebox"]);
add("LED security light dusk-to-dawn 40W", "EA", "lighting", ["dusk to dawn", "barn light", "luz seguridad"]);
add("LED exit sign red with battery backup", "EA", "lighting", ["exit sign", "exit light", "letrero salida"]);
add("LED exit/emergency combo with battery backup", "EA", "lighting", ["exit combo", "exit emergency combo"]);
add("Emergency light twin head LED", "EA", "lighting", ["emergency light", "luz emergencia", "bug eyes"]);
add("Emergency battery ballast LED driver", "EA", "lighting", ["emergency driver", "egress battery"]);
add("LED surface mount 4 in round 120V", "EA", "lighting", ["surface mount led 4", "disk light 4"]);
add("LED surface mount 7 in round 120V", "EA", "lighting", ["surface mount led 7", "disk light"]);
add("LED surface mount 11 in flush mount 120V", "EA", "lighting", ["flush mount 11", "flush led"]);
add("LED under-cabinet light bar 24 in", "EA", "lighting", ["under cabinet", "undercabinet 24", "luz gabinete"]);
add("LED tape light 16 ft 24V", "ROLL", "lighting", ["led strip 24v", "tape light", "cinta led"]);
add("LED driver 24V 100W", "EA", "lighting", ["led power supply 24v", "transformador led 24v", "driver 24v"]);
add("LED driver 12V 60W", "EA", "lighting", ["led power supply 12v", "driver 12v"]);
add("Aluminum channel for LED tape 6 ft", "EA", "lighting", ["led channel", "perfil aluminio"]);
add("Track light head LED", "EA", "lighting", ["track head", "lampara riel"]);
add("Track light rail 4 ft", "EA", "lighting", ["track rail 4", "riel 4 pies"]);
add("Pendant light fixture hardwired", "EA", "lighting", ["pendant", "colgante"]);
add("Vanity light fixture 3-light", "EA", "lighting", ["vanity light", "lampara bano"]);
add("Ceiling fan with light kit", "EA", "lighting", ["ceiling fan", "ventilador techo", "fan with light"]);
add("Bath exhaust fan 80 CFM", "EA", "lighting", ["exhaust fan 80", "bath fan", "extractor bano"]);
add("Bath exhaust fan 110 CFM with light", "EA", "lighting", ["exhaust fan 110", "bath fan light"]);
add("Motion sensor flood light 120V", "EA", "lighting", ["motion flood", "sensor flood light"]);
add("Landscape LED path light 12V", "EA", "lighting", ["path light", "luz jardin"]);
add("Landscape transformer 12V 300W", "EA", "lighting", ["landscape transformer", "transformador jardin"]);
for (const b of ["A19 9W LED 2700K", "A19 9W LED 4000K", "A19 9W LED 5000K", "BR30 LED 9W 2700K", "PAR38 LED 14W 3000K", "GU10 LED 5W 3000K", "MR16 LED 5W 12V 3000K", "Candelabra E12 LED 4W 2700K", "A21 LED 15W 5000K"]) add(`LED bulb ${b}`, "EA", "lighting", [`${b.split(" ")[0].toLowerCase()} led`, `foco led ${b.split(" ")[0].toLowerCase()}`, `bombillo ${b.split(" ")[0].toLowerCase()}`]);
for (const t of ["T8 LED tube 4 ft 15W 4000K ballast bypass", "T8 LED tube 4 ft 18W 5000K plug-and-play", "T8 LED tube 2 ft 9W 4000K"]) add(t, "EA", "lighting", ["t8 led", "led tube", "tubo led"]);
add("Fluorescent T8 ballast electronic 2-lamp", "EA", "lighting", ["t8 ballast", "balastro t8"]);
add("Lamp holder keyless porcelain", "EA", "lighting", ["porcelain socket", "keyless socket", "socket porcelana"]);
add("Medium base lamp socket", "EA", "lighting", ["lamp socket", "socket"]);

// ---- Gear, motors and controls -----------------------------------------------------------------------------------
for (const kva of ["3", "5", "7.5", "10", "15", "25", "30", "45", "75", "112.5"]) add(`Dry-type transformer ${kva} kVA 480V-208Y/120V 3-phase`, "EA", "gear", [`transformer ${kva} kva`, `transformador ${kva}`, `${kva} kva xfmr`, `xfmr ${kva}`]);
for (const kva of ["0.5", "1", "2", "3", "5", "10", "15"]) add(`Dry-type transformer ${kva} kVA 240x480-120/240V single-phase`, "EA", "gear", [`transformer ${kva} kva 1ph`, `control transformer ${kva}`]);
add("Control transformer 100VA 480-120V", "EA", "gear", ["control transformer 100va", "ctrl transformer"]);
add("Control transformer 500VA 480-120V", "EA", "gear", ["control transformer 500va"]);
for (const a of ["225", "400", "600", "800"]) add(`Panelboard 3-phase 208Y/120V ${a}A main lug`, "EA", "panels", [`3 phase panel ${a}`, `panelboard ${a}`, `panel trifasico ${a}`]);
add("Panelboard 3-phase 208Y/120V 225A 42-circuit main breaker", "EA", "panels", ["3ph panel 225 42"]);
add("Distribution panel 480V 3-phase 400A", "EA", "panels", ["480v panel 400", "distribution panel 400"]);
add("Switchboard section 800A 480Y/277V", "EA", "gear", ["switchboard 800"]);
add("Magnetic motor starter size 1 120V coil", "EA", "gear", ["motor starter", "arrancador magnetico", "contactor size 1"]);
add("Magnetic contactor 30A 3-pole 120V coil", "EA", "gear", ["contactor 30a", "contactor 3p", "contactor"]);
add("Overload relay adjustable 9-13A", "EA", "gear", ["overload 9-13", "overload relay"]);
add("Manual motor starter 1-phase 16A", "EA", "gear", ["manual starter", "motor switch"]);
add("Pushbutton station start/stop", "EA", "gear", ["start stop", "estacion botones"]);
add("Selector switch 3-position 22mm", "EA", "gear", ["selector 3 pos", "selector switch"]);
add("Pilot light 22mm LED green", "EA", "gear", ["pilot green 22mm", "luz verde 22mm"]);
add("Pilot light 22mm LED red", "EA", "gear", ["pilot red 22mm", "luz roja 22mm"]);
add("Time clock 24-hour 120V", "EA", "gear", ["timer 24h", "time clock", "reloj programador"]);
add("Astronomic timer 120V", "EA", "gear", ["astro timer", "timer astronomico"]);
add("Lighting contactor 20A 4-pole", "EA", "gear", ["lighting contactor", "contactor iluminacion"]);
add("Relay 8-pin 120V coil", "EA", "gear", ["relay 8 pin", "relay 120v"]);
add("Relay base 8-pin", "EA", "gear", ["relay socket"]);
add("Din rail 35 mm x 1 m", "EA", "gear", ["din rail", "riel din"]);
add("Terminal block DIN rail 30A", "EA", "gear", ["terminal block", "bornera"]);
add("Fuse Class RK5 30A 250V", "EA", "gear", ["fuse rk5 30", "fusible 30"]);
add("Fuse Class RK5 60A 250V", "EA", "gear", ["fuse rk5 60", "fusible 60"]);
add("Fuse Class RK5 100A 250V", "EA", "gear", ["fuse rk5 100"]);
add("Fuse Class J 30A 600V", "EA", "gear", ["class j 30"]);
add("Fuse Class J 60A 600V", "EA", "gear", ["class j 60"]);
add("Cartridge fuse Class H 30A 250V", "EA", "gear", ["fuse 30a cartridge"]);
add("Plug fuse 15A Type S", "EA", "gear", ["plug fuse 15"]);
add("EV charger Level 2 40A hardwired wall-mount", "EA", "gear", ["ev charger", "cargador carro electrico", "evse 40"]);
add("EV charger Level 2 48A NEMA 14-50 plug-in", "EA", "gear", ["ev charger plug in", "evse 48"]);
add("Generator 22 kW standby natural gas/LP", "EA", "gear", ["standby generator", "generador 22kw"]);
add("Portable generator inlet cord 30A 25 ft", "EA", "gear", ["generator cord", "cable generador"]);
add("Utility pole meter pedestal 200A", "EA", "gear", ["temporary pole", "temp pole", "poste temporal"]);
add("Temporary power pole outlet panel", "EA", "gear", ["temp power panel", "spider box"]);
add("Cord reel 50 ft 12/3 retractable", "EA", "gear", ["cord reel"]);
add("Extension cord 25 ft 12/3 SJTW", "EA", "gear", ["extension cord 25", "extension 12/3"]);
add("Extension cord 50 ft 12/3 SJTW", "EA", "gear", ["extension cord 50"]);
add("GFCI cord with 25 ft 12/3", "EA", "gear", ["gfci cord"]);
add("Power strip 6-outlet surge protector", "EA", "gear", ["surge strip", "power strip"]);
add("UPS battery backup 1500VA", "EA", "gear", ["ups 1500", "no break"]);
add("Doorbell wire 18/2", "FT", "wire", ["doorbell cable 18/2", "cable timbre"]);

// ---- Tools and consumables used on the job ------------------------------------------------------------------------
add("Voltage tester non-contact", "EA", "other", ["non contact tester", "voltage pen", "probador voltaje"]);
add("Digital multimeter", "EA", "other", ["multimeter", "multimetro", "fluke"]);
add("Wire stripper 10-18 AWG", "EA", "other", ["wire stripper", "pelacables"]);
add("Lineman pliers 9 in", "EA", "other", ["linesman", "alicate electricista"]);
add("Hole saw bit 3/4 in", "EA", "other", ["hole saw", "sierra copa"]);
add("Hole saw bit 1-1/8 in", "EA", "other", ["hole saw 1 1/8"]);
add("Hole saw bit 2-1/8 in", "EA", "other", ["hole saw 2 1/8", "recessed hole saw"]);
add("Spade drill bit 3/4 in", "EA", "other", ["spade bit 3/4", "barrena plana"]);
add("Auger bit 5/8 in x 18 in", "EA", "other", ["auger bit", "barrena"]);
add("Jab saw / drywall saw", "EA", "other", ["jab saw", "serrucho drywall"]);
add("Reciprocating saw blade 6 in metal", "PKG", "other", ["sawzall blade", "recip blade"]);
add("Conduit bender 1/2 in EMT", "EA", "other", ["emt bender 1/2", "doblador 1/2"]);
add("Conduit bender 3/4 in EMT", "EA", "other", ["emt bender 3/4", "doblador 3/4"]);
add("Conduit reamer", "EA", "other", ["reamer", "escariador"]);
add("Tape measure 25 ft", "EA", "other", ["cinta metrica", "tape measure"]);
add("Level 24 in torpedo", "EA", "other", ["torpedo level", "nivel"]);
add("Marker permanent fine tip", "PKG", "other", ["sharpie", "marcador"]);
add("Work gloves leather", "PAIR", "other", ["gloves", "guantes"]);
add("Safety glasses clear", "EA", "other", ["glasses", "lentes seguridad"]);
add("Hard hat", "EA", "other", ["casco"]);

/** The full starter library (generic standard items). Built once; no duplicates by description. */
export function starterLibrary(): ImportRow[] {
  const seen = new Set<string>();
  return out.filter((r) => {
    const k = r.description.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).map((r) => ({ ...r, aliases: r.aliases.map((a) => a.trim()).filter(Boolean).slice(0, 12) }));
}
