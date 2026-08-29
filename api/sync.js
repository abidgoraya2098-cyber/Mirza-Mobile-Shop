// Vercel Serverless Function: Multi-Device Real-Time Cloud Sync for Mirza Shop
// Uses persistent global cloud storage to sync seamlessly between PC & Mobile

const VAULT_ENDPOINT = 'https://api.restful-api.dev/objects/ff8081819ff5b11001a04bc435a059aa';

let localCache = {
  lastUpdated: Date.now(),
  activeTransactions: [],
  activeExpenses: [],
  closings: []
};

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'POST') {
      const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (data) {
        if (Array.isArray(data.activeTransactions)) localCache.activeTransactions = data.activeTransactions;
        if (Array.isArray(data.activeExpenses)) localCache.activeExpenses = data.activeExpenses;
        if (Array.isArray(data.closings)) localCache.closings = data.closings;
        localCache.lastUpdated = Date.now();

        // Write to persistent cloud storage
        try {
          const payload = {
            name: 'MirzaShop_Global_Ledger_Vault',
            data: {
              activeTransactions: localCache.activeTransactions,
              activeExpenses: localCache.activeExpenses,
              closings: localCache.closings,
              lastUpdated: localCache.lastUpdated
            }
          };

          await fetch(VAULT_ENDPOINT, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } catch (cloudErr) {
          console.warn('[CloudSync] Persistent cloud write warning:', cloudErr.message);
        }
      }
      return res.status(200).json({ success: true, lastUpdated: localCache.lastUpdated });
    }

    if (req.method === 'GET') {
      // Pull from persistent cloud storage
      try {
        const cloudRes = await fetch(VAULT_ENDPOINT, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        if (cloudRes.ok) {
          const cloudData = await cloudRes.json();
          if (cloudData && cloudData.data) {
            const d = cloudData.data;
            if (Array.isArray(d.activeTransactions)) localCache.activeTransactions = d.activeTransactions;
            if (Array.isArray(d.activeExpenses)) localCache.activeExpenses = d.activeExpenses;
            if (Array.isArray(d.closings)) localCache.closings = d.closings;
            if (d.lastUpdated) localCache.lastUpdated = d.lastUpdated;
          }
        }
      } catch (cloudErr) {
        console.warn('[CloudSync] Persistent cloud read warning:', cloudErr.message);
      }

      return res.status(200).json({
        success: true,
        lastUpdated: localCache.lastUpdated,
        activeTransactions: localCache.activeTransactions || [],
        activeExpenses: localCache.activeExpenses || [],
        closings: localCache.closings || []
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
