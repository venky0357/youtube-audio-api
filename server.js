const express = require("express");
const cors = require("cors");
const youtubedl = require("youtube-dl-exec");
const path = require("path");

const app = express();
app.use(cors());

const cache = new Map(); // Cache to store previously fetched audio URLs
const cookiesPath = path.join(__dirname, "cookies.txt"); // Path to cookies file

app.get("/get-audio", async (req, res) => {
    const videoId = req.query.video_id;
    if (!videoId) {
        return res.status(400).json({ error: "Missing video_id parameter" });
    }

    // Return cached result if available
    if (cache.has(videoId)) {
        return res.json({ audio_url: cache.get(videoId) });
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    try {
        const output = await youtubedl(videoUrl, {
            format: "bestaudio",
            getUrl: true,
            cookies: cookiesPath, // Use cookies for authentication
            noCheckCertificates: true, // Skip SSL verification for speed
            extractorRetries: 1, // Reduce retries to avoid delays
            flatPlaylist: true, // Prevent unnecessary metadata fetching
            quiet: true, // Suppress logs for faster execution
            noWarnings: true, // Ignore warnings that slow down the process
        });

        cache.set(videoId, output); // Store in cache
        res.json({ audio_url: output });
    } catch (error) {
        res.status(500).json({ error: "Failed to get audio URL", details: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
