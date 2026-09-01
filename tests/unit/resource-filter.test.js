'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const nativeArrayIncludes = Array.prototype.includes;
const nativeStringIncludes = String.prototype.includes;
const filter = require('../../resource-filter.js');

const resources = [
  {
    id: 1,
    name: 'Emergency Housing Line',
    supportAreas: 'Housing / homelessness;Navigation / case management',
    referralTrigger: 'Needs an emergency shelter bed tonight',
    eligibility: 'Young adults',
    provides: 'Emergency housing navigation',
    access: 'Call the 24/7 crisis line',
    location: 'Charlotte',
    phone: '704-555-0101',
    caveat: 'Availability changes daily',
    fosterSpecific: 'Yes',
    priority: 'Core',
    area: 'Mecklenburg County',
    areaGroup: 'Charlotte / Mecklenburg',
    radiusNote: ''
  },
  {
    id: 2,
    name: 'Nearby Career Center',
    supportAreas: 'Employment / workforce',
    referralTrigger: 'Looking for a job',
    eligibility: 'Adults',
    provides: 'Job coaching',
    access: 'Make an appointment',
    location: 'Nearby community',
    fosterSpecific: 'No',
    priority: 'Backup',
    area: 'Union County',
    areaGroup: 'Surrounding communities'
  },
  {
    id: 3,
    name: 'Statewide Education Aid',
    supportAreas: 'Education',
    referralTrigger: 'Needs help paying for school',
    eligibility: 'North Carolina residents',
    provides: 'Education assistance',
    access: 'Apply online',
    location: 'Statewide',
    fosterSpecific: 'Partial',
    priority: 'Specialized',
    area: 'North Carolina',
    areaGroup: 'Statewide / national'
  }
];

test('loading the module does not replace native includes methods', () => {
  assert.equal(Array.prototype.includes, nativeArrayIncludes);
  assert.equal(String.prototype.includes, nativeStringIncludes);
});

test('support selections round-trip and use OR matching', () => {
  const encoded = filter.encodeSupportValue(['Housing / homelessness', 'Education']);
  assert.deepEqual(filter.decodeSupportValue(encoded), ['Housing / homelessness', 'Education']);
  assert.deepEqual(
    filter.filterResources(resources, { support: encoded }).map((resource) => resource.id),
    [1, 3]
  );
});

test('encoded queries preserve text, urgent, and Charlotte scope', () => {
  const urgentQuery = filter.encodeQueryValue('', true);
  assert.deepEqual(
    filter.filterResources(resources, { query: urgentQuery }).map((resource) => resource.id),
    [1]
  );

  const careerQuery = filter.encodeQueryValue('career', false);
  assert.deepEqual(filter.filterResources(resources, { query: careerQuery }), []);

  const statewideQuery = filter.encodeQueryValue('education', false);
  assert.deepEqual(
    filter.filterResources(resources, { query: statewideQuery }).map((resource) => resource.id),
    [3]
  );
});

test('saved, foster, area, and priority filters compose predictably', () => {
  assert.deepEqual(
    filter.filterResources(resources, {
      savedOnly: true,
      savedIds: new Set(['1', '3']),
      foster: 'yes',
      area: 'Charlotte / Mecklenburg',
      priority: 'Core'
    }).map((resource) => resource.id),
    [1]
  );
});

test('urgent matching excludes listings that explicitly deny emergency service', () => {
  assert.equal(filter.matchesUrgentNeed('Emergency housing crisis hotline'), true);
  assert.equal(filter.matchesUrgentNeed('Mental health support; not an emergency service'), false);
});
