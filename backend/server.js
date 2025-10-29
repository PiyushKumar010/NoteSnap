const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const authRoutes = require("./Routes/auth.js");
const app = express();
const MongoDBStore = require('connect-mongodb-session')(session);
const filesRoutes = require("./Routes/file.js");
const savenotes = require("./Routes/note.js");



app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin:true,
    credentials:true,
}))

const store = new MongoDBStore({
    uri:process.env.MONGODB_URI,
    collection:'sessions' // collections name that will store session data
})

store.on('error', function(error){
    console.log(error);
})

// session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: store,
  
}));



//Mongodb connection 
const Mongodb_URL = process.env.MONGODB_URI;
const connect = async()=>{
    try{
        await mongoose.connect(Mongodb_URL);
        console.log("mongodb connection successful");
    }
    catch(error){
        console.log("error connecting to MongoDB", error.message);
    }
}
connect();

app.use("/user", authRoutes);//authentication routes
app.use("/file",filesRoutes);//cloudinary storage
app.use("/api/notes",savenotes);
app.get("/user/profile", (req, res) => {
  if (req.session && req.session.user) {
    // console.log("YES");
    res.json(req.session.user);
  } else {
    res.status(401).json({ message: "Not logged in" });
  }
});


// simple health route so the server can be probeauthd; from the frontend/dev machine
app.get('/', (req, res) => {
    res.send('Backend is running');
});

// start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://localhost:${PORT}`);
});


