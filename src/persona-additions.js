// Personas present in newer Lufel data but missing from an older generated catalog
// snapshot. Records are copied unchanged from the newer generated catalog (Lufel
// persona data); a Persona is only added when the catalog does not already have it.
export const PERSONA_ADDITIONS = Object.freeze([
 {
  "id": "lufel-persona-125",
  "sourceId": "125",
  "name": "Gabriel",
  "sourceName": "가브리엘",
  "names": {
   "en": "Gabriel",
   "jp": "ガブリエル",
   "cn": "加百列",
   "kr": "가브리엘"
  },
  "grade": 5,
  "stars": 4,
  "position": "지배",
  "element": "curse",
  "tier": null,
  "description": "",
  "comment": "",
  "event": false,
  "bestPersona": false,
  "wildEmblemRainbow": false,
  "craftingCost": null,
  "combinations": [],
  "passive": [
   {
    "name": "Gabriel's Trait 0",
    "description": "Increase skill damage to foes below 50% HP by 10%.",
    "rank": "0",
    "rankValue": 0,
    "sourceIndex": 0,
    "combat": {
     "confidence": "reference-only",
     "runtimeStatus": "reference-only",
     "effects": [],
     "limitations": [
      "Conditional and triggered clauses are reference-only.",
      "Remaining passive text is reference-only."
     ]
    }
   },
   {
    "name": "Gabriel's Trait 1",
    "description": "Increase skill damage to foes below 50% HP by 20%.",
    "rank": "1",
    "rankValue": 1,
    "sourceIndex": 1,
    "combat": {
     "confidence": "reference-only",
     "runtimeStatus": "reference-only",
     "effects": [],
     "limitations": [
      "Conditional and triggered clauses are reference-only.",
      "Remaining passive text is reference-only."
     ]
    }
   },
   {
    "name": "Gabriel's Trait 2",
    "description": "Increase Ice damage.",
    "rank": "2",
    "rankValue": 2,
    "sourceIndex": 2,
    "combat": {
     "confidence": "reference-only",
     "runtimeStatus": "reference-only",
     "effects": [],
     "limitations": [
      "Remaining passive text is reference-only."
     ]
    }
   },
   {
    "name": "Gabriel's Trait 3",
    "description": "After dealing Ice damage, insta-kill foe if the foe's HP is below 5%.",
    "rank": "3",
    "rankValue": 3,
    "sourceIndex": 3,
    "combat": {
     "confidence": "reference-only",
     "runtimeStatus": "reference-only",
     "effects": [],
     "limitations": [
      "Conditional and triggered clauses are reference-only.",
      "Instant-kill clauses are reference-only.",
      "Remaining passive text is reference-only."
     ]
    }
   },
   {
    "name": "Gabriel's Trait 4",
    "description": "Decrease Curse damage taken.",
    "rank": "4",
    "rankValue": 4,
    "sourceIndex": 4,
    "combat": {
     "confidence": "reference-only",
     "runtimeStatus": "reference-only",
     "effects": [],
     "limitations": [
      "Remaining passive text is reference-only."
     ]
    }
   },
   {
    "name": "Gabriel's Trait 5",
    "description": "After knocking down a foe, increase user's Freeze damage by 10% for 2 turns.",
    "rank": "5",
    "rankValue": 5,
    "sourceIndex": 5,
    "combat": {
     "confidence": "reference-only",
     "runtimeStatus": "reference-only",
     "effects": [],
     "limitations": [
      "Battle-start, turn-timed, and duration clauses are reference-only.",
      "Conditional and triggered clauses are reference-only.",
      "Remaining passive text is reference-only."
     ]
    }
   },
   {
    "name": "Gabriel's Trait 6",
    "description": "After dealing Ice damage, insta-kill foe if the foe's HP is below 10%.",
    "rank": "6",
    "rankValue": 6,
    "sourceIndex": 6,
    "combat": {
     "confidence": "reference-only",
     "runtimeStatus": "reference-only",
     "effects": [],
     "limitations": [
      "Conditional and triggered clauses are reference-only.",
      "Instant-kill clauses are reference-only.",
      "Remaining passive text is reference-only."
     ]
    }
   }
  ],
  "maxRankPassive": {
   "name": "Gabriel's Trait 6",
   "description": "After dealing Ice damage, insta-kill foe if the foe's HP is below 10%.",
   "rank": "6",
   "rankValue": 6,
   "sourceIndex": 6,
   "combat": {
    "confidence": "reference-only",
    "runtimeStatus": "reference-only",
    "effects": [],
    "limitations": [
     "Conditional and triggered clauses are reference-only.",
     "Instant-kill clauses are reference-only.",
     "Remaining passive text is reference-only."
    ]
   }
  },
  "recommendedSkills": [],
  "skills": [
   {
    "id": "persona-125-unique-horn-of-judgment-1",
    "name": "Horn of Judgment",
    "sourceName": "심판의 호각",
    "kind": "unique",
    "description": "Deal Ice damage to 1 foe. When defeating a foe with this skill, deal Ice damage equal to 200% of Attack to other foes.",
    "cost": 0,
    "costType": "missing",
    "target": "boss",
    "element": "ice",
    "level": null,
    "learnLevel": null,
    "priority": 0,
    "combat": {
     "executable": true,
     "confidence": "source-described",
     "powerTiers": [
      2
     ],
     "power": 2,
     "limitations": [
      "Conditional, triggered, stack, or cooldown clauses remain reference-only unless represented by structured combat fields."
     ]
    }
   },
   {
    "id": "persona-125-highlight-highlight-1",
    "name": "Highlight",
    "sourceName": "HIGHLIGHT",
    "kind": "highlight",
    "description": "Deal Ice damage to 1 foe equal to 360.0%/385.2%/410.4% of Attack.",
    "cost": 0,
    "costType": "missing",
    "target": "boss",
    "element": "ice",
    "level": null,
    "learnLevel": null,
    "priority": 0,
    "combat": {
     "executable": true,
     "confidence": "source-described",
     "powerTiers": [
      3.6,
      3.852,
      4.104
     ],
     "power": 4.104
    }
   },
   {
    "id": "persona-125-innate-attack-boost-i-1",
    "name": "Attack Boost I",
    "sourceName": "공격 강화Ⅰ",
    "kind": "innate",
    "description": "Increase Attack by 5.8%.",
    "cost": 0,
    "costType": "missing",
    "target": "self",
    "element": "almighty",
    "level": "6/7/8",
    "learnLevel": "1",
    "priority": null,
    "combat": {
     "executable": false,
     "confidence": "reference-only",
     "limitations": [
      "The tooltip does not state the ATK UP duration."
     ]
    }
   },
   {
    "id": "persona-125-innate-pinpoint-i-2",
    "name": "Pinpoint I",
    "sourceName": "정교한 타격Ⅰ",
    "kind": "innate",
    "description": "Increase critical damage by 7%.",
    "cost": 0,
    "costType": "missing",
    "target": "self",
    "element": "almighty",
    "level": "6/7/8",
    "learnLevel": "30",
    "priority": null,
    "combat": {
     "executable": false,
     "confidence": "reference-only",
     "limitations": [
      "The tooltip does not state the CRIT DMG UP duration.",
      "The tooltip does not state the DMG UP duration."
     ]
    }
   },
   {
    "id": "persona-125-innate-phys-boost-i-3",
    "name": "Phys Boost I",
    "sourceName": "물리 강화Ⅰ",
    "kind": "innate",
    "description": "Increase Physical damage by 4.7%.",
    "cost": 0,
    "costType": "missing",
    "target": "self",
    "element": "physical",
    "level": "6/7/8",
    "learnLevel": "50",
    "priority": null,
    "combat": {
     "executable": false,
     "confidence": "reference-only",
     "limitations": [
      "The tooltip does not state the DMG UP duration."
     ]
    }
   }
  ],
  "availability": "reference"
 }
]);

const norm = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export function withPersonaAdditions(personas) {
  const present = new Set(personas.map(persona => norm(persona.name)));
  return [...personas, ...PERSONA_ADDITIONS.filter(persona => !present.has(norm(persona.name)))];
}
