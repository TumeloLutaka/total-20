if (process.env.NODE_ENV !== "production") {
  await import("dotenv/config");
}

import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Server } from "socket.io";
import bcrypt from "bcrypt";
import passport from "passport";
import flash from "express-flash";
import session from "express-session";
import methodOverride from "method-override";


import { socketHandler } from "./src/socket.js";
import gameManager from "./src/GameManager.js";

const app = express();
const server = createServer(app);
const io = new Server(server);
const __dirname = dirname(fileURLToPath(import.meta.url));

const users = [];

import { initialize as initializePassport } from "./src/passportConfig.js";
initializePassport(
  passport,
  (username) => users.find((user) => user.username === username),
  (id) => users.find((user) => user.id === id)
);

app.use(express.static(join(__dirname, "../client")));
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));

app.get("/", checkAuthenticated, (req, res) => {
  res.sendFile(join(__dirname, "../client/"));
});

app.get("/login", checkNotAuthenticated, (req, res) => {
  res.sendFile(join(__dirname, "../client/login.html"));
});

app.post(
  "/login",
  checkNotAuthenticated,
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

app.get("/register", checkNotAuthenticated, (req, res) => {
  res.sendFile(join(__dirname, "../client/register.html"));
});

app.post("/register", checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    users.push({
      id: Date.now().toString(),
      username: req.body.username,
      password: hashedPassword,
    });

    res.redirect("/login");
  } catch (error) {
    res.redirect("/register");
  }
 
  console.log(users);
});

app.get("/game/:roomId", checkNotAuthenticated, (req, res) => {
  res.sendFile(join(__dirname, "../client/game.html"));
});

app.delete("/logout", (req, res) => {
  app.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { 
      return next(err); 
    }
    res.redirect('/');
  });
});
  res.redirect('/login')
 });


socketHandler(io, gameManager);

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect("/login");
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }

  next();
}

server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
