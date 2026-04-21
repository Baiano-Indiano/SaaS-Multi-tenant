const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const TEAM_ID = process.env.VERCEL_TEAM_ID; // Optional, if using a Vercel Team

export async function addDomainToProject(domain: string) {
  if (!VERCEL_TOKEN || !PROJECT_ID) {
    console.warn('Vercel credentials missing. Skipping API call.');
    return { error: 'Missing Vercel configuration' };
  }

  const response = await fetch(
    `https://api.vercel.com/v9/projects/${PROJECT_ID}/domains${TEAM_ID ? `?teamId=${TEAM_ID}` : ''}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: domain }),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    return { error: data.error?.message || 'Failed to add domain' };
  }

  return data;
}

export async function removeDomainFromProject(domain: string) {
  if (!VERCEL_TOKEN || !PROJECT_ID) return;

  await fetch(
    `https://api.vercel.com/v9/projects/${PROJECT_ID}/domains/${domain}${TEAM_ID ? `?teamId=${TEAM_ID}` : ''}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
      },
    }
  );
}

export async function getDomainConfig(domain: string) {
  if (!VERCEL_TOKEN || !PROJECT_ID) {
    return { error: 'Missing Vercel configuration' };
  }

  const [configRes, verifyRes] = await Promise.all([
    fetch(
      `https://api.vercel.com/v6/domains/${domain}/config${TEAM_ID ? `?teamId=${TEAM_ID}` : ''}`,
      {
        headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
      }
    ),
    fetch(
      `https://api.vercel.com/v9/projects/${PROJECT_ID}/domains/${domain}${TEAM_ID ? `?teamId=${TEAM_ID}` : ''}`,
      {
        headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
      }
    ),
  ]);

  const config = await configRes.json();
  const verification = await verifyRes.json();

  return {
    config,
    verification,
    isValid: !verification.error && verification.verified,
  };
}

export async function verifyDomainOwnership(domain: string) {
  if (!VERCEL_TOKEN || !PROJECT_ID) return;

  const response = await fetch(
    `https://api.vercel.com/v9/projects/${PROJECT_ID}/domains/${domain}/verify${TEAM_ID ? `?teamId=${TEAM_ID}` : ''}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
      },
    }
  );

  return await response.json();
}
