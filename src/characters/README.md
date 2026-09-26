# Editable character modules (v2.0.0 runtime)

Keep new implementation data outside generated/reference catalogs. `registry.js` adds local entries after imports and provides engine lifecycle hooks. `config/character-integrations.json` is the input manifest; `npm run verify:characters` validates it, and build runs validation automatically.

Kotone exports `kotoneShiomi`, `kotoneSkills`, `kotoneHighlight`, `kotoneAwareness`, `kotoneWeapons`, `kotoneWeaponProfile`, and the source-audit metadata from `kotone-shiomi-data.js`. Runtime behavior is in `KotoneShiomiMechanics`. All mutable character state lives on `unit.kotone`; methods do not hide state outside the engine snapshot. JSON loadouts retain ordinary ruleset, awareness, weapon, enhancement, stat basis and explicit A2 ratio.

See `docs/KOTONE-IMPLEMENTATION.md` for the exact experimental profile and intentionally unsupported source-dependent values. This overlay is for the uploaded 2.0.0 release, not the separately uploaded newer 2.2.0 architecture.
