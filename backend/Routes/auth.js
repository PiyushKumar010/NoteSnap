const nodemailer = require("nodemailer");
const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
require("dotenv").config();
const router = express.Router();
const User = require("../Models/userModel.js");

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    secure: false,
    auth: {
        user: process.env.EMAIL_USER || "harshitbali320@gmail.com",
        pass: process.env.EMAIL_PASS || "sfusgxipfcryghoj"
    },
    logger: false,
    debug: false
});


//Logout route
router.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ message: "Logout failed" });
        res.clearCookie("connect.sid", {
            path: "/",              // MUST match the session cookie path
            httpOnly: true,
            sameSite: "None",       // MUST match your session setup
            secure: true,           // MUST be true if using HTTPS (Vercel + Render)
        });

        res.json({ message: "Looged out" });
    });
});


// middleware to protect routes
function requiredAuth(req, res, next) {
    if (req.session && req.session.user) return next();
    return res.status(401).json({ message: "Not authenticated" });
}

//signup route
router.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Email already registered" });

        //generate otp
        const otp = crypto.randomInt(100000, 999999).toString();


        //sending email
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: "Your Verification OTP",
                html: `
                <h3>Email Verification</h3>
                <p>Hi ${name},</p>
                <p>Your OTP for email verification is:</p>
                <h2>${otp}</h2>
                <p>This OTP will expire in 10 minutes</p>
            `
            });
        }
        catch (mailErr) {
            console.error("Mail send error:", mailErr);
        }


        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            otp,
            otpExpiresAt: Date.now() + 60 * 60 * 1000,
            isVerified: false
        });
        await newUser.save();



        res.status(200).json({ message: "Registration successful! Check your email for the OTP." });
    }
    catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: "server error" });
    }
});

//verification Route

router.post("/verify", async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.isVerified) return res.status(400).json({ message: "Already verified" });


        // Check otp and expiry
        if (
            user.otp &&
            String(user.otp) === String(otp) &&
            user.otpExpiresAt &&
            user.otpExpiresAt > Date.now()
        ) {
            user.isVerified = true;
            user.otp = undefined;
            user.otpExpiresAt = undefined;
            await user.save();

            return res.status(200).json({
                message: "Verified successfully! You are now logged in.",
            });
        }

        return res.status(400).json({ message: "Invalid or expired OTP" });
    } catch (err) {
        console.error("Verify error:", err);
        res.status(500).json({ message: "Verification failed" });
    }
});



//Login Route
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });
        if (!user.isVerified) return res.status(403).json({ message: "Email not verified" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid Password" });

        //create session
        req.session.user = {
            id: user._id,
            email: user.email,
            fullname: user.name,
        };
        res.status(200).json({ message: "Login successful", user: req.session.user })
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Login Failed" });
    }
});



//session based pages access
// session based pages access - return fresh DB user data when possible
router.get("/profile", async (req, res) => {
    try {
        if (req.session && req.session.user && req.session.user.id) {
            // fetch latest user record from DB to ensure name field is available
            const dbUser = await User.findById(req.session.user.id).select('name email fullname occupation');
            if (!dbUser) return res.status(404).json({ message: 'User not found' });

            // normalize name field
            const name = dbUser.name || dbUser.fullname || '';

            return res.json({
                id: dbUser._id,
                email: dbUser.email,
                name,
                fullname: name,
                occupation: dbUser.occupation,
            });
        }

        return res.status(401).json({ message: 'Not logged in' });
    } catch (err) {
        console.error('Profile fetch error:', err);
        res.status(500).json({ message: 'Failed to fetch profile' });
    }
});


module.exports = router;
