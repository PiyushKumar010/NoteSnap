const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Note = require("../Models/notes");

router.post("/", async (req, res) => {
    try {
        const { title, fileUrl, createdAt } = req.body;
        if (!req.session || !req.session.user || !req.session.user.id) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        const userId = req.session.user.id;

        // Convert userId to ObjectId
        const note = await Note.create({
            title,
            fileUrl,
            user: mongoose.Types.ObjectId(userId),
            createdAt: createdAt || new Date()
        });
        res.status(201).json(note);
    } catch (err) {
        console.error("Failed to save note:", err);
        res.status(500).json({ error: "Failed to save note." });
    }
});

router.get("/", async (req, res) => {
    if (!req.session || !req.session.user || !req.session.user.id) {
        return res.status(401).json({ message: "Not Authenticated" });
    }
    try {
        const userId = req.session.user.id;
        const notes = await Note.find({ user: userId }).sort({ createdAt: -1 });
        res.json(notes);
    } catch (error) {
        console.error("Error fetching notes:", error);
        res.status(500).json({ message: "Failed to fetch notes" });
    }
});

module.exports = router;
