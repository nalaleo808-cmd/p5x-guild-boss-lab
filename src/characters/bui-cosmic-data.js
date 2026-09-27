import { COSMIC_YUI_SOURCE, COSMIC_YUI_LIMITATIONS } from '../cosmic-yui-data.js';

export const characterResearch = {
  slug: 'bui-cosmic', name: 'Cosmic Yui', coverage: 'source-modeled-with-explicit-boundaries',
  sources: [COSMIC_YUI_SOURCE],
  implemented: ['Veggie Knights and energy', 'Harvest Havoc and Veg-Out Attack',
    'Awareness conditions and selected weapon passives', 'Dedicated build controls and battle resources'],
  limitations: [...COSMIC_YUI_LIMITATIONS],
  missing: ['Live confirmation of timing boundaries', 'Extra party All-Out Attack scaling', 'Brainwash accuracy interaction'],
  runtime: 'Existing cosmicYuiMethods in src/cosmic-yui-mechanics.js; do not register duplicate hooks.'
};
