// Access tokens live only in memory. The server rotates an HttpOnly refresh cookie.
let accessToken = null;
export const getAccessToken = () => accessToken;
export const setAccessToken = (value) => { accessToken = value || null; };
