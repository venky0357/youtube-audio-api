const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");

const app = express();
app.use(cors());

const cache = new Map(); // In-memory cache
const cookiesPath = path.join(__dirname, "cookies.txt"); // Path to cookies file

app.get("/get-audio", async (req, res) => {
    const videoId = req.query.video_id;
    if (!videoId) {
        return res.status(400).json({ error: "Missing video_id parameter" });
    }

    // Check if the audio URL is already cached
    if (cache.has(videoId)) {
        return res.json({ audio_url: cache.get(videoId) });
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const ytDlpArgs = [
        "-f", "bestaudio",
        "--get-url",
        "--cookies", cookiesPath,
        "--no-check-certificate",
        "--flat-playlist"
    ];

    const process = spawn("yt-dlp", [...ytDlpArgs, videoUrl]);

    let output = "";
    process.stdout.on("data", (data) => {
        output += data.toString();
    });

    process.on("close", () => {
        if (output.trim()) {
            cache.set(videoId, output.trim()); // Store result in cache
            return res.json({ audio_url: output.trim() });
        } else {
            return res.status(500).json({ error: "Failed to get audio URL" });
        }
    });

    process.on("error", (err) => {
        return res.status(500).json({ error: "Failed to execute yt-dlp", details: err.message });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
