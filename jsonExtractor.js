const proxyConfig = require('./proxyConfig');

async function extractTikTokData(tiktokUrl) {
    try {
        const response = await fetch(tiktokUrl, { agent: proxyConfig.getAgent() });
        const redirectedResponse = await fetch(response.url, { agent: proxyConfig.getAgent() });
        
        const cookies = redirectedResponse.headers.entries();
        let cookieString = '';
        for (const [name, value] of cookies) {
            if (name.toLowerCase() === 'set-cookie') {
                cookieString += value + '; ';
            }
        }

        const html = await redirectedResponse.text();
        const scriptRegex = /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application\/json">(.*?)<\/script>/;
        const match = html.match(scriptRegex);

        if (!match || !match[1]) {
            throw new Error('Video data not found');
        }

        const jsonData = JSON.parse(match[1]);
        const videoDetail = jsonData.__DEFAULT_SCOPE__['webapp.video-detail'];

        return {
            jsonData: videoDetail,
            cookieString
        };
    } catch (error) {
        throw error;
    }
}

module.exports = { extractTikTokData };
