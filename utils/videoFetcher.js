const proxyConfig = require('../proxyConfig');

class VideoFetcher {
    constructor(jsonData, cookieString) {
        this.jsonData = jsonData;
        this.cookieString = cookieString;
        this.videoUrl = this.extractVideoUrl();
    }

    extractVideoUrl() {
        const videoUrl = this.jsonData.itemInfo.itemStruct.video.playAddr;
        if (!videoUrl) {
            throw new Error('Video URL not found in JSON data');
        }
        return videoUrl;
    }

    async getVideoMetadata() {
        const headResponse = await fetch(this.videoUrl, {
            method: 'HEAD',
            agent: proxyConfig.getAgent() ,
            headers: {
                'Cookie': this.cookieString
            }
        });

        return {
            contentLength: headResponse.headers.get('content-length'),
            contentType: headResponse.headers.get('content-type') || 'video/mp4'
        };
    }

    async streamVideo(range = null) {
        const headers = {
            'Cookie': this.cookieString
        };

        if (range) {
            headers['Range'] = `bytes=${range.start}-${range.end}`;
        }

        const videoResponse = await fetch(this.videoUrl, {
            agent: proxyConfig.getAgent(),
            headers
        });

        if (!videoResponse.ok) {
            throw new Error(`Failed to fetch video: ${videoResponse.status}`);
        }

        return videoResponse;
    }
}

module.exports = { VideoFetcher };
