const express = require("express");

module.exports = function (app) {
  app.use(express.json({ limit: "50MB" }));
  app.use(express.urlencoded({ limit: "50MB", extended: true }));

  // const admin = require("../routes/admin");
  const auth = require("../routes/auth");
  const users = require("../routes/users");
  const content = require("../routes/content");
  const subscription = require("../routes/subscription");

  app.use("/auth", auth);
  app.use("/users", users);
  app.use("/content", content);
  app.use("/subscription", subscription);
  app.get("*", (req, res) => {
    res.send({
      code: 404,
      message:
        "invalid request please check our api documentation for all routes",
    });
  });
};
