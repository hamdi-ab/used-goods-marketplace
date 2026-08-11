import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const START_VUS = Number(__ENV.START_VUS || 100);
const END_VUS = Number(__ENV.END_VUS || 200);
const RAMP_SEC = Number(__ENV.RAMP_SEC || 30);
const HOLD_SEC = Number(__ENV.HOLD_SEC || 60);
const SEARCH_QUERY = __ENV.SEARCH_QUERY || 'phone';
const LISTING_ID = __ENV.LISTING_ID || '';
const LIMIT = Number(__ENV.LIMIT || 20);

const stages = [
  { duration: `${RAMP_SEC}s`, target: START_VUS },
  { duration: `${HOLD_SEC}s`, target: START_VUS },
  { duration: `${RAMP_SEC}s`, target: END_VUS },
  { duration: `${HOLD_SEC}s`, target: END_VUS },
  { duration: '10s', target: 0 },
];

export const options = {
  scenarios: {
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: stages,
      exec: 'publicTraffic',
    },
  },
  thresholds: {
    'http_req_duration{name:home}': ['p(95)<300'],
    'http_req_duration{name:browse}': ['p(95)<300'],
    'http_req_duration{name:listing-detail}': ['p(95)<300'],
    'http_req_duration{name:search}': ['p(95)<500'],
    'http_req_failed{name:home}': ['rate<0.01'],
    'http_req_failed{name:browse}': ['rate<0.01'],
    'http_req_failed{name:listing-detail}': ['rate<0.01'],
    'http_req_failed{name:search}': ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

const browseUrl = `${BASE_URL}/api/v1/listings?page=1&limit=${LIMIT}`;
const searchUrl = `${BASE_URL}/api/v1/search?query=${encodeURIComponent(SEARCH_QUERY)}`;

function extractListingId(res) {
  if (!res || !res.body) return '';
  try {
    const json = res.json();
    const arr = json && (json.data || json.listings || json.results);
    if (Array.isArray(arr) && arr.length > 0 && arr[0].id) return String(arr[0].id);
    if (json && json.id) return String(json.id);
  } catch (e) {
    return '';
  }
  return '';
}

export function publicTraffic() {
  const home = http.get(`${BASE_URL}/`, { tags: { name: 'home' } });
  check(home, {
    'home status 200': (r) => r.status === 200,
  });
  sleep(randomIntBetween(1, 3));

  const browse = http.get(browseUrl, { tags: { name: 'browse' } });
  check(browse, {
    'browse status 200': (r) => r.status === 200,
  });
  sleep(randomIntBetween(1, 3));

  const search = http.get(searchUrl, { tags: { name: 'search' } });
  check(search, {
    'search status 200': (r) => r.status === 200,
  });
  sleep(randomIntBetween(1, 3));

  let listingId = LISTING_ID || extractListingId(browse);
  if (listingId) {
    const detail = http.get(`${BASE_URL}/api/v1/listings/${listingId}`, {
      tags: { name: 'listing-detail' },
    });
    check(detail, {
      'listing-detail status 200': (r) => r.status === 200,
    });
  }
  sleep(randomIntBetween(1, 3));
}
