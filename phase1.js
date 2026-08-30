(() => {
  'use strict';
  const parts = [1, 2, 3, 4, 5, 6, 7].map((number) => `/phase1/part-${String(number).padStart(2, '0')}.txt`);
  Promise.all(parts.map(async (url) => {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Could not load ${url}: ${response.status}`);
    return response.text();
  }))
    .then((sourceParts) => {
      const script = document.createElement('script');
      script.src = URL.createObjectURL(new Blob([sourceParts.join('')], { type: 'text/javascript' }));
      script.onload = () => URL.revokeObjectURL(script.src);
      document.head.appendChild(script);
    })
    .catch((error) => console.error('Phase 1 loader failed:', error));
})();
