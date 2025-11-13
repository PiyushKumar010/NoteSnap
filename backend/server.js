const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const MongoDBStore = require("connect-mongodb-session")(session);

// Import routes
const authRoutes = require("./Routes/auth.js");
const filesRoutes = require("./Routes/file.js");
const notesRoutes = require("./Routes/note.js");

const app = express();

// ✅ Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Allow frontend domain for cross-site cookies
const allowedOrigins = [
  "https://note-snap-git-main-piyush-kumars-projects-852896c7.vercel.app", // ⚠️ replace with your exact Vercel frontend URL
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// ✅ Session Store
const store = new MongoDBStore({
  uri: process.env.MONGODB_URI,
  collection: "sessions",
});

store.on("error", (error) => console.log("Session store error:", error));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_secret_key",
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
      httpOnly: true,
      secure: true, // ✅ Render is HTTPS, so this must be true
      sameSite: "none", // ✅ Allows cross-site cookies
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// ✅ MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
  }
};
connectDB();

// ✅ Routes
app.use("/user", authRoutes);
app.use("/file", filesRoutes);
app.use("/api/notes", notesRoutes);

app.get("/", (req, res) => res.send("✅ Backend is running fine!"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
