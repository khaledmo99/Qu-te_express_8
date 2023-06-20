const express = require("express");

const app = express();

const router = require("./router");
const port = 5353;

app.use(express.json());

app.use(router);

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
