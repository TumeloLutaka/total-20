if (process.env.NODE_ENV !== "production") {
  await import("dotenv/config");
}

import express from "express";
import { createServer } from "node:http";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";
import methodOverride from "method-override";

// Passport Setup
import session from "express-session";
import passport from "passport";
import { Strategy as CustomStrategy } from "passport-custom";
import passportSocketIO from "passport.socketio";
import flash from "connect-flash";

// Personal imports
import { socketHandler } from "./src/socketConfig.js";
import gameManager from "./src/GameManager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Users databse
const users = [];

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static("client"));
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false },
});
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(methodOverride("_method"));

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser((id, done) => {
  const user = users.find((user) => user.id == id);
  done(null, user);
});
passport.use(
  new CustomStrategy((req, done) => {
    const { name } = req.body;
    if (!name || name.trim() === "")
      return done(null, false, { message: "Name is required" });

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      return done(null, false, {
        message: "Nam must be at least 2 characters long",
      });
    }

    let user = users.find((user) => user.name === trimmedName);
    if (user) {
      // User already exists - prevent login
      return done(null, false, {
        message: "This name is already taken. Please choose another name.",
      });
    }

    if (!user) {
      user = {
        id: Date.now().toString(),
        name: trimmedName,
        socketId: null,
      };

      users.push(user);
    }

    return done(null, user);
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

io.engine.use(sessionMiddleware);
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, () => {
    passport.initialize()(socket.request, {}, () => {
      passport.session()(socket.request, {}, () => {
        if (socket.request.user) {
          next();
        } else {
          next(new Error("Unauthorized"));
        }
      });
    });
  });
});

app.set("view engine", "ejs");
app.set("views", `${__dirname}/views`);

app.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    return res.render("home.ejs", { user: req.user });
  }

  res.render("login.ejs", { error: req.flash("error") });
});

app.get("/login", (req, res) => {
  if (req.isAuthenticated()) {
    return res.render("home.ejs", { user: req.user });
  }

  res.render("login.ejs", { error: req.flash("error") });
});

app.get("/game/:roomId", (req, res) => {
  res.render("game.ejs");
});

app.post(
  "/login",
  passport.authenticate("custom", {
    successRedirect: "/",
    failureRedirect: "/",
    failureFlash: true,
  })
);

app.delete("/logout", (req, res, next) => {
  const userId = req.user?.id;

  // 1. Remove user from your "database" array
  if (userId) {
    const index = users.findIndex((user) => user.id === userId);
    if (index !== -1) {
      users.splice(index, 1);
    }
  }

  // 2. Passport logout (clears req.user)
  req.logout((err) => {
    if (err) return next(err);

    // 3. Destroy session and redirect
    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie("connect.sid"); // Matches your session cookie name
      res.redirect("/"); // Send them back to the login/home logic
    });
  });
});

socketHandler(io, gameManager);

const PORT = 3000;
server.listen(PORT, () => {
  console.log("Server running on: " + PORT);
});
