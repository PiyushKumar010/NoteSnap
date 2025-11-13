const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const authRoutes = require("./Routes/auth.js");
const filesRoutes = require("./Routes/file.js");
const savenotes = require("./Routes/note.js");
const MongoDBStore = require('connect-mongodb-session')(session);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: true,
    credentials: true,
}));

const store = new MongoDBStore({
    uri: process.env.MONGODB_URI,
    collection: 'sessions'
});

store.on('error', function(error){
    console.log(error);
});

app.use(session({
    secret: process.env.SESSION_SECRET || "your_secret_key",
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
        secure: process.env.NODE_ENV === "production", // set true if using https in prod
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    }
}));

// MongoDB connection
const Mongodb_URL = process.env.MONGODB_URI;
const connect = async () => {
    try {
        await mongoose.connect(Mongodb_URL);
        console.log("mongodb connection successful");
    } catch (error) {
        console.log("error connecting to MongoDB", error.message);
    }
}
connect();

app.use("/user", authRoutes);
app.use("/file", filesRoutes);
app.use("/api/notes", savenotes);

app.get("/user/profile", (req, res) => {
    if (req.session && req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).json({ message: "Not logged in" });
    }
});

app.get('/', (req, res) => {
    res.send('Backend is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
