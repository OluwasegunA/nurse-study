const bcrypt = require("bcrypt");
const uuidv1 = require("uuid/v1");
const router = require("express").Router();
const jwt = require("jsonwebtoken");

const { User, validate } = require("../models/users");
const {
  ensureAuthenticated,
  forwardAuthenticated,
  upload,
} = require("../middlewares/auth");
const { send } = require("../util/mailer");

router.post("/login", forwardAuthenticated, async (req, res) => {
  try {
    let { email, password } = req.body;
    if (!email || !password)
      return res.send({
        code: 400,
        message: "please enter all details",
        data: {},
      });

    let user = await User.findOne({ email });
    if (!user)
      return res.send({
        code: 400,
        message: "user does not exist, please register",
        data: {},
      });

    let validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.send({
        code: 400,
        message: "Invalid email or password",
        data: {},
      });

    if (user.status === "blocked")
      return res.send({
        code: 400,
        message: "user has been blocked from the system, please contact admin",
        data: {},
      });

    const token = user.generateAuthToken();
    res.send({
      code: 200,
      message: "Successfully Logged in",
      token: token,
    });
  } catch (error) {
    res.send({
      code: 400,
      message: "An error occurred",
    });
  }
});

router.post("/register", async (req, res) => {
  console.log(req.body);
  let { firstname, email, password } = req.body;
  try {
    let { error } = validate(req.body);
    if (error)
      return res.send({
        code: 400,
        message: error.details[0].message,
      });

    let user = await User.findOne({ email });
    if (user)
      return res.send({
        code: 400,
        message: "User already registered.",
      });

    let user_id = uuidv1();
    img = req.imageName;
    user = new User({
      user_id,
      firstname,
      email,
      password,
    });
    const token = user.generateAuthToken();
    let salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    let new_user = await user.save();
    res.send({
      code: 200,
      message: "user registered successfully",
      token,
      data: {
        email: new_user.email,
        firstname: new_user.firstname,
      },
    });
  } catch (error) {
    res.send({
      code: 400,
      message: "An error occurred",
      data: error,
    });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    let { email } = req.body;

    user = await User.findOne({ email });

    if (!user) {
      return res.send({
        code: 400,
        message: "User doesn't exist",
      });
    }
    // generate reset token
    const { token } = user.generateAuthToken();
    console.log({ token });
    // send password to mail
    await send({
      mail: "reset-password",
      email,
      data: {
        subject: "NLR: Password Reset Email",
        action_url: process.env.WEB_URL + "/reset-password/" + token,
        name: user.firstname,
      },
    });

    res.send({
      code: 200,
      message: "password reset email sent.",
    });
  } catch (error) {
    res.send({
      code: 500,
      message: "An error occurred",
      data: error.message,
    });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    let { new_password, confirm_password, token } = req.body;

    if (!new_password || !confirm_password || !token) {
      return res.send({
        code: 400,
        message: "All fields are required!",
      });
    }

    if (new_password.length < 8) {
      return res.send({
        code: 400,
        message: "Password length must be atleast 8 characters",
      });
    }
    if (new_password !== confirm_password) {
      return res.send({
        code: 400,
        message: "Confirmed passwords don't match",
      });
    }
    let decoded = null;
    let user = null;

    try {
      decoded = jwt.verify(token, process.env.SECRET);
      user = await User.findById(decoded.id);
    } catch (error) {
      return res.send({
        code: 404,
        message: error.message,
      });
    }

    if (!user) {
      return res.send({
        code: 400,
        message: "User doesn't exist",
      });
    }

    let salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(new_password, salt);
    await user.save();

    res.send({
      code: 200,
      message: "password reset successful.",
    });
  } catch (error) {
    res.send({
      code: 500,
      message: "An error occurred",
      data: error.message,
    });
  }
});

router.post("/change-password", ensureAuthenticated, async (req, res) => {
  try {
    let user_id = req.userId;
    let { password, newPassword } = req.body;
    if (!password || !newPassword)
      return res.send({
        code: 400,
        message: "Kindly fill all inputs",
        data: {},
      });
    let user = await User.findOne({ user_id });
    let validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.send({
        code: 400,
        message: "Wrong Password",
        data: {},
      });
    user = await updatePassword(user_id, newPassword);
    res.send({
      error: 200,
      message: "Password successfully changed,login now",
      data: {},
    });
  } catch (error) {
    res.send({
      code: 400,
      message: "An Error Occurred",
      data: { error },
    });
  }
});

module.exports = router;
