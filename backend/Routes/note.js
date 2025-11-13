const express = require("express");
const mongoose = require("mongoose");
const Note = require("../Models/notes");
const router = express.Router();

// 🔹 Save Note
router.post("/", async (req, res) => {
  try {
    const { title, fileUrl, createdAt } = req.body;
    if (!req.session?.user?.id)
      return res.status(401).json({ message: "Not authenticated" });

    const note = await Note.create({
      title,
      fileUrl,
      user: mongoose.Types.ObjectId(req.session.user.id),
      createdAt: createdAt || new Date(),
    });

    res.status(201).json(note);
  } catch (err) {
    console.error("Failed to save note:", err);
    res.status(500).json({ error: "Failed to save note." });
  }
});

// 🔹 Get All Notes
router.get("/", async (req, res) => {
  if (!req.session?.user?.id)
    return res.status(401).json({ message: "Not authenticated" });

  try {
    const notes = await Note.find({ user: req.session.user.id }).sort({
      createdAt: -1,
    });
    res.json(notes);
  } catch (err) {
    console.error("Error fetching notes:", err);
    res.status(500).json({ message: "Failed to fetch notes" });
  }
});

module.exports = router;
