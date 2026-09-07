const cnchar = require('cnchar');
const radical = require('cnchar-radical');
cnchar.use(radical);

console.log('Radical:', cnchar.radical('好'));
console.log('Object keys of cnchar:', Object.keys(cnchar));
