const express = require("express");
const cors = require("cors");
const youtubedl = require("youtube-dl-exec");

const app = express();
app.use(cors());

app.get("/get-audio", async (req, res) => {
    const videoId = req.query.video_id;
    if (!videoId) {
        return res.status(400).json({ error: "Missing video_id parameter" });
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    try {
        const output = await youtubedl(videoUrl, {
            format: "bestaudio",
            getUrl: true
        });
        res.json({ audio_url: output });
    } catch (error) {
        res.status(500).json({ error: "Failed to get audio URL", details: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
