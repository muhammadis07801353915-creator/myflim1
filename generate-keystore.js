const forge = require('node-forge');
const fs = require('fs');

console.log('Generating RSA key pair (this may take a moment)...');
const keys = forge.pki.rsa.generateKeyPair(2048);
const cert = forge.pki.createCertificate();
cert.publicKey = keys.publicKey;
cert.serialNumber = '01';
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 27); // 10000 days

const attrs = [{
  name: 'commonName',
  value: 'Taban Cars'
}, {
  name: 'countryName',
  value: 'IQ'
}, {
  shortName: 'ST',
  value: 'Erbil'
}, {
  name: 'localityName',
  value: 'Erbil'
}, {
  name: 'organizationName',
  value: 'Taban'
}, {
  shortName: 'OU',
  value: 'Mobile'
}];
cert.setSubject(attrs);
cert.setIssuer(attrs);

// self-sign certificate
cert.sign(keys.privateKey);

console.log('Creating PKCS12 keystore...');
const p12Asn1 = forge.pkcs12.toPkcs12Asn1(
  keys.privateKey, [cert], 'tabancars123',
  { generateLocalKeyId: true, friendlyName: 'taban-key' }
);
const p12Der = forge.asn1.toDer(p12Asn1).getBytes();

fs.writeFileSync('taban-release.keystore', p12Der, 'binary');
console.log('Done! Keystore created successfully as taban-release.keystore');
