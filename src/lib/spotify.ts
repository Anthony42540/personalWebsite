import querystring from "querystring";

const clientID = import.meta.env.CLIENT_ID;
const clientSecret = import.meta.env.CLIENT_SECRET;
const refreshToken = import.meta.env.REFRESH_TOKEN;

const TOKEN_URL = `https://accounts.spotify.com/api/token`;
const basicAuth = Buffer.from(`${clientID}:${clientSecret}`).toString("base64");

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    if (retries > 0) {
      console.warn("Spotify API error, retrying:", err.message ?? err);
      return withRetry(fn, retries - 1);
    }
    throw err;
  }
}

const getAccessToken = async (): Promise<{ access_token: string }> => {
  return withRetry(async () => {
    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: querystring.stringify({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Spotify token refresh failed:",
        response.status,
        errorText
      );
      throw new Error(`Failed to refresh token: ${response.status}`);
    }

    return response.json();
  });
};

const NOW_PLAYING_URL = `https://api.spotify.com/v1/me/player/currently-playing`;

const getNowPlaying = async (): Promise<Response> => {
  const { access_token } = await getAccessToken();

  if (!access_token) {
    throw new Error("No access token received from Spotify");
  }

  return withRetry(async () => {
    const response = await fetch(NOW_PLAYING_URL, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!response.ok && response.status !== 204) {
      const errorText = await response.text();
      console.error("Spotify now playing failed:", response.status, errorText);
      throw new Error(`Failed to fetch now playing: ${response.status}`);
    }

    return response;
  });
};

export { getAccessToken, getNowPlaying };
