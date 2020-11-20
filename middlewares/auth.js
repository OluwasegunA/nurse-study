const jwt = require("jsonwebtoken");
const config = require("config");
const { User } = require("../models/users");

module.exports = {
  forwardAuthenticated: (req, res, next) => {
    const token = req.header("x-auth-token");
    const shouldContinue = process.env.ALLOW_ALL_OPERATIONS;
    if (!shouldContinue)
      return res
        .status(401)
        .send("Access denied. Sorry temporarily Locked down");
    if (!token) {
      return next();
    }
  },
  ensureAuthenticated: async (req, res, next) => {
    const token = req.header("x-auth-token");
    const shouldContinue = process.env.ALLOW_ALL_OPERATIONS;
    if (!shouldContinue)
      return res
        .status(401)
        .send("Access denied. Sorry temporarily Locked down");
    if (!token)
      return res
        .status(401)
        .send("Access denied. No token provided,please login first.");

    try {
      const decoded = jwt.verify(token, process.env.SECRET);
      req.user = await User.findById(decoded.id);
      req.userId = decoded.id;
      next();
    } catch (ex) {
      res.status(400).send("Invalid token.");
    }
  },
  ensurePostAuthenticated: (req, res, next) => {
    const token = req.header("x-auth-token");
    const shouldContinue = process.env.ALLOW_ALL_OPERATIONS;
    if (!shouldContinue)
      return res
        .status(401)
        .send("Access denied. Sorry temporarily Locked down");
    if (!token)
      return res.status(401).send("Access denied. No token provided.");

    try {
      const decoded = jwt.verify(token, process.env.SECRET);
      req.user = decoded;
      next();
    } catch (ex) {
      res.status(400).send("Invalid token.");
    }
  },
  ensureAuthorized: async (req, res, next) => {
    const token = req.header("x-auth-token");
    const shouldContinue = process.env.ALLOW_ALL_OPERATIONS;
    if (!shouldContinue)
      return res
        .status(401)
        .send("Access denied. Sorry temporarily Locked down");
    if (!token)
      return res.status(401).send("Access denied. No token provided.");

    try {
      const decoded = jwt.verify(token, process.env.SECRET);
      req.user = decoded;
      req.userId = decoded.id;
      if (!req.user.isAdmin)
        return res
          .status(403)
          .send("Access denied,Unauthorized to perform this action");
      next();
    } catch (ex) {
      res.status(400).send("Invalid token.");
    }
  },
  ensurePostAuthorized: async (req, res, next) => {
    try {
      const token = req.header("x-auth-token");
      const shouldContinue = process.env.ALLOW_ALL_OPERATIONS;
      if (!shouldContinue)
        return res
          .status(401)
          .send("Access denied. Sorry temporarily Locked down");
      if (!token)
        return res.status(401).send("Access denied. No token provided.");

      const decoded = jwt.verify(token, process.env.SECRET);
      req.user = decoded;
      req.userId = decoded.id;
      if (!req.user.isAdmin)
        return res
          .status(403)
          .send("Access denied,Unauthorized to perform this action");
      return next();
    } catch (ex) {
      res.status(400).send("Invalid token.");
    }
    // },

    // upload: (req, res, next) => {
    //   var imageName;
    //   var uploadStorage = multer.diskStorage({
    //       destination: function (req, file, cb) {
    //           cb(null, './images');
    //       },
    //       filename: function (req, file, cb) {
    //           imageName = file.originalname;
    //           //imageName += "_randomstring"
    //           cb(null, imageName);
    //       }
    //   });

    //   var uploader = multer({storage: uploadStorage});

    //   var uploadFile = uploader.single('image');

    //   uploadFile(req, res, function (err) {
    //       req.imageName = imageName;
    //       req.uploadError = err;
    //       next();
    //   });
  },
};
