// Vercel Serverless Function: Multi-Device Real-Time Cloud Sync for Mirza Shop
// Allows seamless real-time ledger synchronization between PC and Mobile devices

let inMemoryStore = {
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
        if (Array.isArray(data.activeTransactions)) {
          inMemoryStore.activeTransactions = data.activeTransactions;
        }
        if (Array.isArray(data.activeExpenses)) {
          inMemoryStore.activeExpenses = data.activeExpenses;
        }
        if (Array.isArray(data.closings)) {
          inMemoryStore.closings = data.closings;
        }
        inMemoryStore.lastUpdated = Date.now();
      }
      return res.status(200).json({ success: true, lastUpdated: inMemoryStore.lastUpdated });
    }

    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        lastUpdated: inMemoryStore.lastUpdated,
        activeTransactions: inMemoryStore.activeTransactions || [],
        activeExpenses: inMemoryStore.activeExpenses || [],
        closings: inMemoryStore.closings || []
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
