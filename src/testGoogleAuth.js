const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;

const body = new URLSearchParams({
  grant_type: "refresh_token",
  client_id: clientId,
  client_secret: clientSecret,
  refresh_token: refreshToken
});

const response = await fetch(
  "https://oauth2.googleapis.com/token",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  }
);

const data = await response.json();

if (!response.ok) {
  console.error("Google OAuth failed:");
  console.error(data);
  process.exit(1);
}

console.log("Google OAuth SUCCESS");
console.log("Access token received:", !!data.access_token);
console.log("Expires in:", data.expires_in);
