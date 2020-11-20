const {
  ensureAuthenticated,
  ensureAuthorized,
  forwardAuthenticated,
} = require("../middlewares/auth");
const { User } = require("../models/users");
const { ReadArticle } = require("../models/articleRead");
const { Result } = require("../models/results");
const { Subscription } = require("../models/subscription");
const express = require("express");
const { Activity } = require("../models/activity");
const router = express.Router();

router.get("/me", ensureAuthenticated, async (req, res) => {
  const user = await User.findById(req.userId).select("-password");

  let articleRead = await ReadArticle.findOne({ user_id: req.userId });
  let test = await Result.findOne({ user_id: req.userId });

  let articleCount = 0;
  let testTaken = 0;
  let testPassed = 0;
  let totalTestScore = 0;
  let testPerformance = 0;

  if (articleRead == null || articleRead == "") {
  } else {
    articleCount = articleRead.read.length;
  }
  if (test == null || test == "") {
  } else {
    // Test Performance, test Passed and Test Taken
    testTaken = test.scores.length;
    test.scores.forEach((score) => {
      if (score.passed) {
        testPassed += 1;
      }
    });
    testPerformance = (testPassed / testTaken) * 100;
  }
  console.log({ ...user });
  res.json({
    ...user._doc,
    testPerformance,
    testPassed,
    testTaken,
    articleCount,
  });
});

router.post("/activity", ensureAuthenticated, async (req, res) => {
  try {
    const { type, title, description } = req.body;

    if (!type) {
      return res.status(400).json({
        message: "Please specify a type",
      });
    }

    if (!title) {
      return res.status(400).json({
        message: "Please specify a title",
      });
    }

    const duplicate = await Activity.findOne({
      title,
    });

    if (duplicate) {
      return res.status(400).json({
        message: "Activity already exists",
      });
    }

    const existingActivities = await Activity.find({
      user_id: req.userId,
    });

    if (existingActivities && existingActivities.length > 6) {
      console.log({ existingActivities });
      await Activity.findByIdAndDelete(existingActivities[0]._id);
    }

    const activity = await Activity.create({
      user_id: req.userId,
      type,
      title,
      description,
    });

    return res.status(201).json({
      message: "success",
      data: activity,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "An internal error occured!",
    });
  }
});

router.get("/activity", ensureAuthenticated, async (req, res) => {
  try {
    const activity = await Activity.find({
      user_id: req.userId,
    });

    res.status(201).json({
      message: "success",
      data: activity,
    });
  } catch (error) {
    res.status(500).json({
      message: "An internal error occured!",
    });
  }
});

router.get("/", ensureAuthenticated, async (req, res) => {
  let users = await User.find({}).select("-password");
  // await Promise.all(
  //   users.map(async (user) => {
  //     if (user.subscription !== "free") {
  //       let sub = await Subscription.findOne({ _id: user.subscription });
  //       let subType = sub.plan;
  //       user.subscription = subType;
  //     }
  //   })
  // );
  res.send(users);
});

router.put("/block/:id", ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id },
      { status: "blocked" },
      { new: true }
    );

    if (!user)
      return res.send({
        code: 401,
        message: "user does not exist",
        data: {},
      });

    res.send({
      code: 200,
      message: "User Blocked",
      data: user,
    });
  } catch (error) {
    res.send({
      code: 400,
      message: "An error occurred",
    });
  }
});

router.put("/unblock/:id", ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id },
      { status: "active" },
      { new: true }
    );

    if (!user)
      return res.send({
        code: 401,
        message: "user does not exist",
        data: {},
      });

    res.send({
      code: 200,
      message: "User Activated",
      data: user,
    });
  } catch (error) {
    res.send({
      code: 400,
      message: "An error occurred",
    });
  }
});

router.put("/userSubscription/:id", ensureAuthenticated, async (req, res) => {
  try {
    let { subId } = req.params.id;
    if (!subId)
      return res.send({
        code: 401,
        message: "Specify Subscription Id",
        data: {},
      });
    const user = await User.findOneAndUpdate(
      { _id: req.userId },
      { subscription: subId },
      { new: true }
    );
    if (!user)
      return res.send({
        code: 401,
        message: "user does not exist",
        data: {},
      });

    res.send({
      code: 200,
      message: "User Subcription Activated",
      data: user,
    });
  } catch (error) {
    res.send({
      code: 400,
      message: `An error occured ${error}`,
    });
  }
});

module.exports = router;
