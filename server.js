const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(express.static('public'));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/scrape', async (req, res) => {
    try {
        const { url, selector } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL requise' });
        }

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const title = $('title').text();
        
        let results = [];

        if (selector) {
            $(selector).each((index, element) => {
                const text = $(element).text().trim();
                if (text && index < 100) {
                    results.push(text);
                }
            });
        } else {
            // Scraper TOUT le contenu textuel
            $('p, h1, h2, h3, h4, h5, h6, li, span, div, article, section').each((index, element) => {
                const text = $(element).text().trim();
                if (text && text.length > 10 && index < 100) {
                    results.push(text);
                }
            });
        }

        res.json({
            success: true,
            title,
            url,
            results,
            count: results.length
        });

    } catch (error) {
        console.error('Erreur:', error.message);
        res.status(400).json({ 
            error: 'Impossible de scraper cette URL',
            details: error.message 
        });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur de scraping en cours d'exécution sur http://0.0.0.0:${PORT}`);
});
