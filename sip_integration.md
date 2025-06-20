# Frontend SIP Call Demo Guide

This guide provides instructions for creating a basic frontend demo to initiate a SIP call. The demo will use a hardcoded organization API key for authentication.

## Overview

The process involves two main steps:
1.  **Authentication**: Exchange the organization API key for a JSON Web Token (JWT).
2.  **Initiate SIP Call**: Use the JWT to authorize a request to the SIP endpoint.

---

## Step 1: Get an Access Token

First, you need to authenticate with the backend to get an access token. This is done by sending a `POST` request to the `/profiles/login` endpoint with the organization's API key in the headers.

-   **URL**: `https://fastapi-server-1081098542602.us-central1.run.app/profiles/login`
-   **Method**: `POST`
-   **Headers**:
    -   `api_key`: `cai_AAeT5TJqcFpSaqLK6QeBgk3c9z9iBEI8dpF4aNTN8zWdokg3-OYzWrs_sW4QOZDLMtsH2FZ2Pf0gE6wCTd3FDQ`
    -   `Content-Type`: `application/json`
-   **Body**:

    ```json
    {
      "email": "demo.user@example.com",
      "name": "Demo User"
    }
    ```

### Example (JavaScript `fetch`)

```javascript
async function getAccessToken() {
  const apiKey = 'cai_AAeT5TJqcFpSaqLK6QeBgk3c9z9iBEI8dpF4aNTN8zWdokg3-OYzWrs_sW4QOZDLMtsH2FZ2Pf0gE6wCTd3FDQ';
  const url = 'https://fastapi-server-1081098542602.us-central1.run.app/profiles/login';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_key': apiKey,
      },
      body: JSON.stringify({
        email: 'demo.user@example.com',
        name: 'Demo User',
      }),
    });

    if (!response.ok) {
      throw new Error(`Authentication failed with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Authentication successful:', data);
    return data.access_token; // Return the access token
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}
```

---

## Step 2: Make the SIP Call

Once you have the `access_token`, you can use it to make an authenticated call to the `/sip/` endpoint. The token must be included in the `Authorization` header as a `Bearer` token.

-   **URL**: `https://fastapi-server-1081098542602.us-central1.run.app/sip/`
-   **Method**: `POST`
-   **Headers**:
    -   `Authorization`: `Bearer <YOUR_ACCESS_TOKEN>`
    -   `Content-Type`: `application/json`
-   **Body**:

    ```json
    {
      "name": "Recipient Name",
      "phone": "+15551234567",
      "usecase_id": "c4908121-d6ec-4fac-bf71-2769da7ed90d",
      "email": "recipient.email@example.com"
    }
    ```

### Example (JavaScript `fetch`)

```javascript
async function makeSipCall(accessToken) {
  if (!accessToken) {
    console.error('No access token provided.');
    return;
  }

  const url = 'https://fastapi-server-1081098542602.us-central1.run.app/sip/';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: 'Ketan',
        phone: '+917981564521',
        usecase_id: 'c4908121-d6ec-4fac-bf71-2769da7ed90d',
        email: 'ketanjain805@gmail.com',
      }),
    });

    if (!response.ok) {
      throw new Error(`SIP call failed with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('SIP call initiated successfully:', data);
    alert('SIP call initiated successfully!');
  } catch (error) {
    console.error('Error making SIP call:', error);
  }
}

// Example usage:
async function runDemo() {
    const token = await getAccessToken();
    if (token) {
        await makeSipCall(token);
    }
}

// runDemo();
```
