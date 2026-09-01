(function (root, factory) {
  'use strict';

  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) root.ResourceFilter = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  'use strict';

  const SUPPORT_PREFIX = '__rn_support__:';
  const QUERY_PREFIX = '__rn_query__:';

  const STRONG_URGENT_SIGNALS = [
    'call 911', 'call or text 988', '988', '24/7', '24 hours', 'crisis line',
    'crisis hotline', 'emergency shelter', 'emergency food', 'same day', 'same-day',
    'tonight', 'immediate danger', 'overdose', 'domestic violence', 'sexual assault',
    'human trafficking', 'coordinated entry', 'shelter bed', 'walk-in crisis', 'urgent care'
  ];

  const URGENT_AREAS = [
    'housing / homelessness',
    'food and basic needs',
    'food / essentials',
    'mental health',
    'mental health / recovery',
    'safety / domestic violence / trafficking',
    'substance-use recovery'
  ];

  const URGENT_ACCESS_SIGNALS = [
    'emergency', 'crisis', 'hotline', 'immediate', 'walk-in', 'shelter', 'same day'
  ];

  function normalize(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  function tagList(value) {
    return String(value || '')
      .split(';')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function encodeSupportValue(values) {
    const selected = [...new Set((values || []).map(String).map((value) => value.trim()).filter(Boolean))];
    if (!selected.length) return 'all';
    if (selected.length === 1) return selected[0];
    return `${SUPPORT_PREFIX}${selected.map((value) => encodeURIComponent(value)).join('~')}`;
  }

  function decodeSupportValue(value) {
    const input = String(value || '');
    if (!input || input === 'all') return [];
    if (!input.startsWith(SUPPORT_PREFIX)) return [input];
    return input.slice(SUPPORT_PREFIX.length).split('~').map((item) => {
      try {
        return decodeURIComponent(item);
      } catch {
        return item;
      }
    }).map((item) => item.trim()).filter(Boolean);
  }

  function encodeQueryValue(text, urgent, options = {}) {
    const params = new URLSearchParams();
    if (options.charlotte !== false) params.set('scope', 'charlotte');
    params.set('urgent', urgent ? '1' : '0');
    const normalizedText = normalize(text);
    if (normalizedText) params.set('text', normalizedText);
    return `${QUERY_PREFIX}${params.toString()}`;
  }

  function decodeQueryValue(value) {
    const input = String(value || '');
    if (!input.startsWith(QUERY_PREFIX)) {
      return { text: input, urgent: false, charlotte: false };
    }

    const params = new URLSearchParams(input.slice(QUERY_PREFIX.length));
    return {
      text: params.get('text') || '',
      urgent: params.get('urgent') === '1',
      charlotte: params.get('scope') === 'charlotte'
    };
  }

  function buildSearchText(resource) {
    return normalize([
      resource?.name,
      resource?.supportAreas,
      resource?.referralTrigger,
      resource?.eligibility,
      resource?.provides,
      resource?.access,
      resource?.location,
      resource?.phone,
      resource?.caveat,
      resource?.fosterSpecific,
      resource?.priority,
      resource?.area,
      resource?.areaGroup,
      resource?.radiusNote
    ].join(' '));
  }

  function matchesUrgentNeed(value) {
    const haystack = normalize(value);
    if (STRONG_URGENT_SIGNALS.some((signal) => haystack.includes(signal))) return true;

    return URGENT_AREAS.some((area) => haystack.includes(area))
      && URGENT_ACCESS_SIGNALS.some((signal) => haystack.includes(signal))
      && !haystack.includes('not an emergency service');
  }

  function normalizeFilters(filters = {}) {
    const decodedQuery = filters.query !== undefined
      ? decodeQueryValue(filters.query)
      : { text: filters.text || '', urgent: false, charlotte: false };

    const supportValues = Array.isArray(filters.supportValues)
      ? filters.supportValues.map(String).filter(Boolean)
      : decodeSupportValue(filters.support || 'all');

    return {
      text: filters.text !== undefined ? String(filters.text || '') : decodedQuery.text,
      urgent: Boolean(filters.urgent ?? decodedQuery.urgent),
      charlotteOnly: Boolean(filters.charlotteOnly ?? decodedQuery.charlotte),
      supportValues,
      foster: filters.foster || 'all',
      area: filters.area || 'all',
      priority: filters.priority || 'all',
      savedOnly: Boolean(filters.savedOnly),
      savedIds: filters.savedIds instanceof Set
        ? filters.savedIds
        : new Set(Array.isArray(filters.savedIds) ? filters.savedIds.map(String) : [])
    };
  }

  function matchesResource(resource, filters = {}) {
    const current = normalizeFilters(filters);
    const supportAreas = tagList(resource?.supportAreas);

    if (current.supportValues.length
      && !current.supportValues.some((value) => supportAreas.includes(value))) return false;

    if (current.area !== 'all' && resource?.areaGroup !== current.area) return false;
    if (current.priority !== 'all' && resource?.priority !== current.priority) return false;

    if (current.foster !== 'all') {
      const foster = normalize(resource?.fosterSpecific);
      if (current.foster === 'yes' && foster !== 'yes') return false;
      if (current.foster === 'partial' && foster !== 'partial') return false;
      if (current.foster === 'no' && foster !== 'no') return false;
    }

    if (current.savedOnly && !current.savedIds.has(String(resource?.id))) return false;

    const haystack = buildSearchText(resource);
    if (current.charlotteOnly && haystack.includes('surrounding communities')) return false;
    if (current.text && !haystack.includes(normalize(current.text))) return false;
    if (current.urgent && !matchesUrgentNeed(haystack)) return false;

    return true;
  }

  function filterResources(resources, filters = {}) {
    return (Array.isArray(resources) ? resources : [])
      .filter((resource) => matchesResource(resource, filters));
  }

  return Object.freeze({
    SUPPORT_PREFIX,
    QUERY_PREFIX,
    normalize,
    tagList,
    encodeSupportValue,
    decodeSupportValue,
    encodeQueryValue,
    decodeQueryValue,
    buildSearchText,
    matchesUrgentNeed,
    normalizeFilters,
    matchesResource,
    filterResources
  });
});
