// main.js
const express = require('express');
const path = require('path');
const { extractTikTokData } = require('./jsonExtractor');
const { VideoFetcher } = require('./utils/videoFetcher');

const app = express();
const port = 3500;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/stream', async (req, res) => {
    try {
        const tiktokUrl = req.query.url;
        if (!tiktokUrl) {
            return res.status(400).send('No URL provided');
        }

        const { jsonData, cookieString } = await extractTikTokData(tiktokUrl);

        const videoFetcher = new VideoFetcher(jsonData, cookieString);
        const metadata = await videoFetcher.getVideoMetadata();

        const range = req.headers.range;
        let videoResponse;

        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : metadata.contentLength - 1;
            const chunkSize = end - start + 1;
            
            videoResponse = await videoFetcher.streamVideo({ start, end });

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${metadata.contentLength}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': metadata.contentType
            });
        } else {
            videoResponse = await videoFetcher.streamVideo();
            
            res.writeHead(200, {
                'Content-Length': metadata.contentLength,
                'Content-Type': metadata.contentType,
                'Accept-Ranges': 'bytes'
            });
        }

        const reader = videoResponse.body.getReader();
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(value);
            }
            res.end();
        } catch (error) {
            console.error('Streaming error:', error);
            if (!res.headersSent) {
                res.status(500).send('Streaming error occurred');
            }
        } finally {
            reader.releaseLock();
        }

    } catch (error) {
        console.error('Error:', error);
        if (!res.headersSent) {
            res.status(500).send('Error processing video: ' + error.message);
        }
    }
});

app.get('/metadata', async (req, res) => {
    try {
        const tiktokUrl = req.query.url;
        if (!tiktokUrl) {
            return res.status(400).json({ error: 'No URL provided' });
        }

        const { jsonData } = await extractTikTokData(tiktokUrl);
        
        const metadata = {
            desc: jsonData.itemInfo.itemStruct.desc,
            stats: jsonData.itemInfo.itemStruct.stats,
            author: {
                nickname: jsonData.itemInfo.itemStruct.author.nickname,
                avatarThumb: jsonData.itemInfo.itemStruct.author.avatarThumb
            },
            music: jsonData.itemInfo.itemStruct.music
        };

        res.json(metadata);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
