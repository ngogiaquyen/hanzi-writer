const cnchar = require('cnchar');
const radical = require('cnchar-radical');
cnchar.use(radical);

console.log(cnchar.radical('好'));
console.log(cnchar.radical('我'));
