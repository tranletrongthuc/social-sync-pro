const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Get timeout from environment variable or default to 15 seconds
const AIRTABLE_REQUEST_TIMEOUT = parseInt(process.env.AIRTABLE_REQUEST_TIMEOUT) || 15000;

// Retry function with exponential backoff
const retryWithBackoff = async (fn, retries = 3, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // If this is the last retry, don't wait and re-throw
      if (i === retries) {
        throw lastError;
      }
      
      // Don't retry on client errors (4xx) except for rate limiting (429)
      if (error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw lastError;
      }
      
      // Log retry attempt
      console.warn(`Airtable request failed, retrying in ${delay}ms... (attempt ${i + 1}/${retries + 1})`);
      
      // Wait for the specified delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Double the delay for next retry (exponential backoff)
      delay *= 2;
    }
  }
  
  throw lastError;
};

export const makeAirtableRequest = async (method, path, body = null) => {
  const { AIRTABLE_PAT, AIRTABLE_BASE_ID } = process.env;

  if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
    const missing = [];
    if (!AIRTABLE_PAT) missing.push('AIRTABLE_PAT');
    if (!AIRTABLE_BASE_ID) missing.push('AIRTABLE_BASE_ID');
    throw new Error(`Airtable credentials not configured on server. Missing: ${missing.join(', ')}`);
  }

  // Handle different types of paths:
  // 1. Meta operations like "meta/bases/tables" should become "meta/bases/${AIRTABLE_BASE_ID}/tables"
  // 2. Table operations like "Brands" should become "${AIRTABLE_BASE_ID}/Brands"
  let fullPath;
  if (path.startsWith('meta/bases/')) {
    // Meta operation - insert the base ID after "meta/bases/"
    fullPath = path.replace('meta/bases/', `meta/bases/${AIRTABLE_BASE_ID}/`);
  } else {
    // Regular table operation - prepend the base ID
    fullPath = `${AIRTABLE_BASE_ID}/${path}`;
  }
  
  const url = `https://api.airtable.com/v0/${fullPath}`;
  
  const airtableHeaders = {
    'Authorization': `Bearer ${AIRTABLE_PAT}`,
    'Content-Type': 'application/json'
  };

  const fetchOptions = { 
    method, 
    headers: airtableHeaders,
    timeout: AIRTABLE_REQUEST_TIMEOUT
  };
  
  if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    // Wrap the fetch call with retry logic
    const responseData = await retryWithBackoff(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AIRTABLE_REQUEST_TIMEOUT);
      
      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const data = await response.json();

        if (!response.ok) {
          // Attach status to error object for retry logic
          const error = new Error(`Airtable API error: ${response.status} ${response.statusText} - ${JSON.stringify(data)}`);
          error.status = response.status;
          throw error;
        }

        return data;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    }, 3, 1000); // 3 retries, starting with 1 second delay

    return responseData;
  } catch (error) {
    // Log the final error for debugging
    console.error('Airtable request failed after all retries:', error);
    
    // Re-throw with a more descriptive message
    if (error.name === 'AbortError') {
      throw new Error(`Airtable API timeout: Request took longer than ${AIRTABLE_REQUEST_TIMEOUT}ms`);
    }
    
    throw error;
  }
};

// Helper function to find a record by field value
export const findRecordByField = async (tableName, fieldName, value) => {
  const encodedValue = encodeURIComponent(value);
  const path = `${tableName}?filterByFormula={${fieldName}}='${encodedValue}'`;
  const response = await makeAirtableRequest('GET', path);
  
  if (!response || !Array.isArray(response.records)) {
    return null;
  }
  
  const record = response.records && response.records.length > 0 ? response.records[0] : null;
  
  if (record && (!record.id || typeof record.id !== 'string')) {
    return null;
  }
  
  return record;
};

// Helper function to fetch records by formula
export const fetchFullRecordsByFormula = async (tableName, formula, fields) => {
  let path = `${tableName}`;
  const queryParams = [];

  if (formula) {
    queryParams.push(`filterByFormula=${encodeURIComponent(formula)}`);
  }

  if (fields && fields.length > 0) {
    fields.forEach(f => queryParams.push(`fields[]=${encodeURIComponent(f)}`));
  }

  if (queryParams.length > 0) {
    path += '?' + queryParams.join('&');
  }

  const response = await makeAirtableRequest('GET', path);
  return response.records || [];
};

// Helper function to get record ID from custom ID
export const getRecordIdFromCustomId = async (tableName, customIdField, customIdValue) => {
  const record = await findRecordByField(tableName, customIdField, customIdValue);
  if (record && record.id) {
    return record.id;
  }
  return null;
};