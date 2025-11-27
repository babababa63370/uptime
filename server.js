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
        if (!data[url]) {
            data[url] = { groups: [], downtimes: [], status: 'up', lastCheck: new Date().toISOString() };
        }
        
        // Migration des anciennes données
        if (!data[url].groups) {
            data[url].groups = [];
        }
        if (!data[url].downtimes) {
            data[url].downtimes = [];
        }
        
        // Créer un groupe de 10 minutes
        const now = new Date();
        const tenMinAgo = new Date(now.getTime() - 10 * 60000);
        const timeKey = Math.floor(now.getTime() / (10 * 60000)) * (10 * 60000);
        
        let currentGroup = data[url].groups.find(g => g.timeKey === timeKey);
        if (!currentGroup) {
            currentGroup = { timeKey, timestamp: new Date(timeKey).toISOString(), upCount: 0, downCount: 0, avgResponseTime: 0, responseTimes: [] };
            data[url].groups.push(currentGroup);
        }
        
        currentGroup.upCount++;
        currentGroup.responseTimes.push(responseTime);
        currentGroup.avgResponseTime = Math.round(currentGroup.responseTimes.reduce((a, b) => a + b, 0) / currentGroup.responseTimes.length);
        
        // Garder les 30 derniers groupes (5 heures)
        if (data[url].groups.length > 30) {
            data[url].groups = data[url].groups.slice(-30);
        }
        
        data[url].status = 'up';
        data[url].lastCheck = new Date().toISOString();
        saveData(data);
        
        res.json({ success: true, status: 'up', responseTime });
    } catch (error) {
        let data = loadData();
        if (!data[url]) {
            data[url] = { groups: [], downtimes: [], status: 'down', lastCheck: new Date().toISOString() };
        }
        
        // Migration des anciennes données
        if (!data[url].groups) {
            data[url].groups = [];
        }
        if (!data[url].downtimes) {
            data[url].downtimes = [];
        }
        
        const now = new Date();
        const timeKey = Math.floor(now.getTime() / (10 * 60000)) * (10 * 60000);
        
        let currentGroup = data[url].groups.find(g => g.timeKey === timeKey);
        if (!currentGroup) {
            currentGroup = { timeKey, timestamp: new Date(timeKey).toISOString(), upCount: 0, downCount: 0, avgResponseTime: 0, responseTimes: [] };
            data[url].groups.push(currentGroup);
        }
        
        currentGroup.downCount++;
        
        // Enregistrer les downtimes
        if (!data[url].lastDowntime || new Date(data[url].lastDowntime) < new Date(now.getTime() - 60000)) {
            data[url].downtimes.push({
                timestamp: new Date().toISOString(),
                error: error.message
            });
            if (data[url].downtimes.length > 100) {
                data[url].downtimes = data[url].downtimes.slice(-100);
            }
        }
        data[url].lastDowntime = new Date().toISOString();
        
        if (data[url].groups.length > 30) {
            data[url].groups = data[url].groups.slice(-30);
        }
        
        data[url].status = 'down';
        data[url].lastCheck = new Date().toISOString();
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
