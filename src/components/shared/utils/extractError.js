/**
 * Extracts a user-facing error message from an Axios/API error.
 *
 * Priority:
 *   1. Network error (no response at all)
 *   2. data.errors[] (validation errors array)
 *   3. data.response_message
 *   4. data.message
 *   5. data.error.message (nested)
 *   6. error.message (e.g. timeout / ECONNABORTED)
 *   7. fallback string
 */
const extractError = (error, fallback = 'Something went wrong. Please try again.') => {
  if (!error?.response) {
    if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    return 'Network error. Please check your internet connection and try again.';
  }
  const { data } = error.response;
  if (Array.isArray(data?.errors) && data.errors.length) return data.errors.join('. ');
  return data?.response_message || data?.message || data?.error?.message || error?.message || fallback;
};

export default extractError;
