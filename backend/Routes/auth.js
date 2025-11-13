const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const User = require("../Models/userModel.js");

// 🔹 Signup route
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });
    await newUser.save();

    // create session immediately after signup
    req.session.user = {
      id: newUser._id,
      email: newUser.email,
      fullname: newUser.name,
    };

    res
      .status(200)
      .json({ message: "Signup successful", user: req.session.user });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 🔹 Login route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    req.session.user = {
      id: user._id,
      email: user.email,
      fullname: user.name,
    };

    res.status(200).json({ message: "Login successful", user: req.session.user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
});

// 🔹 Logout route
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });

    res.clearCookie("connect.sid", {
      path: "/",
      httpOnly: true,
      sameSite: "None",
      secure: true,
    });

    res.json({ message: "Logged out" });
  });
});

// 🔹 Profile route
router.get("/profile", async (req, res) => {
  try {
    if (req.session && req.session.user) {
      res.json(req.session.user);
    } else {
      res.status(401).json({ message: "Not logged in" });
    }
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

module.exports = router;
