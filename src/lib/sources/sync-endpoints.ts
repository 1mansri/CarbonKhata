/**
 * Maps a live DataSource's name to its refresh API route. Used by the
 * Sources page to decide which sources get a "Refresh" button and where
 * it should POST to.
 */
export const SYNC_ENDPOINTS: Record<string, string> = {
  "Climate TRACE": "/api/sync/climatetrace",
  "Ember (grid electricity)": "/api/sync/ember",
};
