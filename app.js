const express = require("express");
const app = express();
var csrf = require("tiny-csrf");
var cookieParser = require("cookie-parser");
const { Todo, User } = require("./models");
const bodyParser = require("body-parser");
const path = require("path");
const connectEnsureLogin = require("connect-ensure-login");
const passport = require("passport");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const flash = require("connect-flash");
app.set("views", path.join(__dirname, "views"));
app.use(flash());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

app.use(
  session({
    secret: "my-super-secret-key-65387687",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async function (user) {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Not a Valid Password" });
          }
        })
        .catch((error) => {
          console.log(error);
          return done(null, false, { message: "Not a Valid Mail" });
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

app.set("view engine", "ejs");

app.get("/", async (request, response) => {
  if (request.user != undefined) {
    response.redirect("/todos");
  } else {
    response.render("index", {
      title: "Todo application",
      csrfToken: request.csrfToken(),
    });
  }
});

app.get(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const loggedInUser = request.user.id;
    console.log(loggedInUser);
    const duetoday = await Todo.dueToday(loggedInUser);
    const duelater = await Todo.dueLater(loggedInUser);
    const allTodos = await Todo.getTodos(loggedInUser);
    const overdues = await Todo.overdue(loggedInUser);
    const completedTodo = await Todo.completedtodos(loggedInUser);
    if (request.accepts("html")) {
      response.render("todos", {
        title: "Todo application",
        overdues,
        duelater,
        duetoday,
        completedTodo,
        csrfToken: request.csrfToken(),
        firstname: request.user.firstName,
        lastname: request.user.lastName,
      });
    } else {
      response.json({ allTodos, overdues, duelater, duetoday });
    }
  }
);

//...login page rendering..

app.get("/login", (request, response) => {
  if (request.user != undefined) {
    response.redirect("/todos");
  } else {
    console.log(request.body.user);
    response.render("login", {
      title: "login",
      csrfToken: request.csrfToken(),
    });
  }
});

//...Sign Up page rendering..
app.get("/signup", (request, response) => {
  if (request.user != undefined) {
    response.redirect("/todos");
  } else {
    console.log(request.body.user);
    response.render("signup", {
      title: "Signup",
      csrfToken: request.csrfToken(),
    });
  }
});

//...Sign out page rendering..

app.get("/signout", (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});

app.use(express.static(path.join(__dirname, "public")));

app.post("/users", async (request, response) => {
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  console.log("PASSWORD IS", hashedPwd);
  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd,
    });
    request.login(user, (err) => {
      if (err) {
        console.log(err);
      }
      response.redirect("/todos");
    });
  } catch (error) {
    console.log(error);
    for (let i = 0; i < error.errors.length; i++) {
      request.flash("error", error.errors[i].message);
    }
    response.redirect("/signup");
  }
});

//...getting all todos..

app.get("/todos", async function (_request, response) {
  console.log("Processing list of all Todos ...");
  const todo = await Todo.findAll();
  return response.json(todo);
});

//...getting todos by id..

app.get("/todos/:id", async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

//.....creating session...

app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (request, response) => {
    console.log(request.user);
    response.redirect("/todos");
  }
);
//...ensured login user updatdation

app.post(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    try {
      await Todo.addTodo({
        title: request.body.title,
        dueDate: request.body.dueDate,
        userId: request.user.id,
      });
      request.flash("success", "Added todo successfully");
      return response.redirect("/todos");
    } catch (error) {
      if (error.errors) {
        for (let i = 0; i < error.errors.length; i++) {
          request.flash("error", error.errors[i].message);
        }
      }
      if (error.parameters && error.parameters[1] === "Invalid date") {
        request.flash("error", error.parameters[1]);
      }

      return response.redirect("/todos");
    }
  }
);

//...deleting todoss...

app.delete(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    console.log("We have to delete a Todo with ID: ", request.params.id);
    try {
      await Todo.remove(request.params.id, request.user.id);
      return response.json({ success: true });
    } catch (error) {
      return response.status(422).json(error);
    }
  }
);

app.put(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const todo = await Todo.findByPk(request.params.id);
    try {
      const updatedTodo = await todo.setCompletionStatus(
        request.body.completed,
        request.user.id
      );
      return response.json(updatedTodo);
    } catch (error) {
      console.log(error);

      return response.status(422).json(error);
    }
  }
);

module.exports = app;
