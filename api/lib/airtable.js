const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

export const makeAirtableRequest = async (method, path, body = null) => {
  const { AIRTABLE_PAT, AIRTABLE_BASE_ID } = process.env;

  if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
    throw new Error('Airtable credentials not configured on server');
  }

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${path}`;
  
  const airtableHeaders = {
    'Authorization': `Bearer ${AIRTABLE_PAT}`,
    'Content-Type': 'application/json'
  };

  const fetchOptions = { method, headers: airtableHeaders };
  
  if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);
  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(`Airtable API error: ${response.status} ${response.statusText} - ${JSON.stringify(responseData)}`);
  }

  return responseData;
};