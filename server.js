const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;
const DATA_FILE = 'uptime_data.json';

app.use(express.json());
app.use(express.static('.'));

// Charger ou créer les données
function loadData() {
    if (fs.existsSync(DATA_FILE)) {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
    return {};
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET la page d'accueil
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// POST ajouter une URL à monitorer
app.post('/api/add-site', (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL requise' });

    let data = loadData();
    if (!data[url]) {
        data[url] = { pings: [], status: 'pending' };
        saveData(data);
    }
    res.json({ success: true, url });
});

// POST faire un ping
app.post('/api/ping', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL requise' });

    const startTime = Date.now();
    try {
        await axios.get(url, { timeout: 5000 });
        const responseTime = Date.now() - startTime;
        
        let data = loadData();
        if (!data[url]) data[url] = { pings: [], status: 'up' };
        
        data[url].pings.push({
            timestamp: new Date().toISOString(),
            status: 'up',
            responseTime
        });
        
        // Garder seulement les 100 derniers pings
        if (data[url].pings.length > 100) {
            data[url].pings = data[url].pings.slice(-100);
        }
        
        data[url].status = 'up';
        saveData(data);
        
        res.json({ success: true, status: 'up', responseTime });
    } catch (error) {
        let data = loadData();
        if (!data[url]) data[url] = { pings: [], status: 'down' };
        
        data[url].pings.push({
            timestamp: new Date().toISOString(),
            status: 'down',
            responseTime: null
        });
        
        if (data[url].pings.length > 100) {
            data[url].pings = data[url].pings.slice(-100);
        }
        
        data[url].status = 'down';
        saveData(data);
        
        res.json({ success: true, status: 'down', error: error.message });
    }
});

// GET tous les sites
app.get('/api/sites', (req, res) => {
    const data = loadData();
    res.json(data);
});

// GET un site spécifique
app.get('/api/site/:id', (req, res) => {
    const { id } = req.params;
    const url = Buffer.from(id, 'base64').toString();
    const data = loadData();
    if (data[url]) {
        res.json(data[url]);
    } else {
        res.status(404).json({ error: 'Site non trouvé' });
    }
});

// DELETE un site
app.delete('/api/site/:id', (req, res) => {
    const { id } = req.params;
    const url = Buffer.from(id, 'base64').toString();
    let data = loadData();
    delete data[url];
    saveData(data);
    res.json({ success: true });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur uptime monitor sur http://0.0.0.0:${PORT}`);
});
