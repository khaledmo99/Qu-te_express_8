const express = require("express");
const router = express.Router();
const argon = require("argon2");
const database = require("./db_client");

router.post("/api/login", (req, res) => {
  const { email } = req.body;

  database
    .query("select * from users where email = ?", [email])
    .then(([users]) => {
      if (users[0] != null) {
        req.user = users[0];

        next();
      } else {
        res.sendStatus(401);
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error retrieving data from database");
    });
});

router.get("/", (req, res) => {
  res.status(200).json(" Bienvenue chez moi");
});

router.get("/test", (req, res) => {
  res.status(200).json("Je suis sur ma 2eme route");
});

router.post("/test/newtest/:id", (req, res) => {
  const body = req.body;
  const params = req.params;
  const query = req.query;
  console.log("body :>> ", body);
  console.log("params :>> ", params);
  console.log("query :>> ", query);
  res.status(200).json("Je suis sur ma 2eme route");
});

router.get("/users", (req, res) => {
  database
    .query("select * from users")
    .then(([result]) => {
      res.status(200).json(result);
    })
    .catch((error) => {
      console.log("error :>> ", error);
      res.status(500).json(error);
    });
});

router.post("/user", async (req, res) => {
  const hashingOptions = {
    type: argon.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    paralleslism: 1,
  };

  try {
    const { firstname, lastname, email, city, language, password } = req.body;

    const hashedPassword = await argon.hash(password, hashingOptions);
    delete req.body.password;

    const user = await database.query(
      " insert into users (firstname, lastname, email, city, language, hashedPassword) values (?, ?, ? ,? ,?,?)",
      [firstname, lastname, email, city, language, hashedPassword]
    );
    console.log("user", user);
    res.status(200).json("user created");
  } catch (error) {
    res.status(500).json("user not created");
  }
});

const jwt = require("jsonwebtoken"); // don't forget to import

// ...

const verifyPassword = (req, res) => {
  argon2
    .verify(req.user.hashedPassword, req.body.password)
    .then((isVerified) => {
      if (isVerified) {
        const payload = { sub: req.user.id };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
          expiresIn: "1h",
        });

        delete req.user.hashedPassword;
        res.send({ token, user: req.user });
      } else {
        res.sendStatus(401);
      }
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
};

const verifyToken = (req, res, next) => {
  try {
    const authorizationHeader = req.get("Authorization");

    if (authorizationHeader == null) {
      throw new Error("Authorization header is missing");
    }

    const [type, token] = authorizationHeader.split(" ");

    if (type !== "Bearer") {
      throw new Error("Authorization header has not the 'Bearer' type");
    }

    req.payload = jwt.verify(token, process.env.JWT_SECRET);

    next();
  } catch (err) {
    console.error(err);
    res.sendStatus(401);
  }
};

app.post("/api/user", verifyToken, movieHandlers.postMovie);

module.exports = router;
