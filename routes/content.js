const {
  ensureAuthenticated,
  // ensurePostAuthenticated,
  // ensurePostAuthorized,
  // ensureAuthorized,
} = require("../middlewares/auth");
const { Subscription } = require("../models/subscription");
const { Question } = require("../models/questions");
const { Article } = require("../models/articles");
const { Section } = require("../models/sections");
const { Result } = require("../models/results");
const { Topic } = require("../models/topics");
const { Quiz } = require("../models/quizzes");
const { Media } = require("../models/media");
const { User } = require("../models/users");
const { ReadArticle } = require("../models/articleRead");

const express = require("express");
const { TheoryQuestion } = require("../models/theory");
const router = express.Router();

router.post("/theory", ensureAuthenticated, async (req, res) => {
  try {
    let { question, section_id } = req.body;

    if (!question) {
      return res.json(400).json({
        message: "Please specify a question",
      });
    }

    if (!section_id) {
      return res.json(400).json({
        message: "Please specify a section_id",
      });
    }

    const isExist = await TheoryQuestion.findOne({ section_id, question });

    if (isExist) {
      return res.status(400).json({
        message: "Question already exists!",
      });
    }

    const theoryQuestion = await TheoryQuestion.create({
      section_id,
      question,
    });

    res.status(201).json({
      message: "Succesfully created",
      data: theoryQuestion,
    });
  } catch (error) {
    res.status(500).json({
      message: "An internal error occured!",
    });
  }
});

router.get("/theory/:section_id", ensureAuthenticated, async (req, res) => {
  try {
    let { section_id } = req.params;

    if (!section_id) {
      return res.json(400).json({
        message: "Please specify a section_id",
      });
    }

    const theoryQuestions = await TheoryQuestion.find({ section_id });

    res.status(201).json({
      message: "Succesfully retrieved",
      data: theoryQuestions,
    });
  } catch (error) {
    res.status(500).json({
      message: "An internal error occured!",
    });
  }
});

router.put("/theory", ensureAuthenticated, async (req, res) => {
  try {
    let { section_id, question_id, question } = req.body;

    if (!section_id) {
      return res.json(400).json({
        message: "Please specify a section_id",
      });
    }

    const theoryQuestions = await TheoryQuestion.update(
      { section_id, _id: question_id },
      {
        question,
      }
    );

    res.status(201).json({
      message: "Succesfully updated",
      data: theoryQuestions,
    });
  } catch (error) {
    res.status(500).json({
      message: "An internal error occured!",
    });
  }
});

router.delete("/theory/:question_id", ensureAuthenticated, async (req, res) => {
  try {
    let { question_id } = req.params;

    await TheoryQuestion.deleteOne({
      _id: question_id,
    });

    res.status(201).json({
      message: "Succesfully deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: "An internal error occured! " + error.message,
    });
  }
});

router.get("/topics", ensureAuthenticated, async (req, res) => {
  const topics = await Topic.find();
  res.send({
    code: 200,
    data: topics,
  });
});

router.get("/sections", ensureAuthenticated, async (req, res) => {
  const sections = await Section.find();
  res.send({
    code: 200,
    data: sections,
  });
});

router.get("/section/:id", ensureAuthenticated, async (req, res) => {
  const section = await Section.find({ _id: req.params.id });

  if (!section)
    return res.send({
      code: 400,
      message: "invalid section, please put a valid section id to get section",
    });

  res.send({
    code: 200,
    data: section,
  });
});

router.get("/section_questions/:id", ensureAuthenticated, async (req, res) => {
  const question = await Question.find({ section_id: req.params.id });

  if (!question)
    return res.send({
      code: 400,
      message: "invalid section, please put a valid section id to get question",
    });

  res.send({
    code: 200,
    data: question,
  });
});

router.get("/section_articles/:id", ensureAuthenticated, async (req, res) => {
  const articles = await Article.find({ section_id: req.params.id });

  if (!articles)
    return res.send({
      code: 400,
      message: "invalid section, please put a valid section id to get articles",
    });

  res.send({
    code: 200,
    data: articles,
  });
});

router.get("/section_media/:id", ensureAuthenticated, async (req, res) => {
  const media = await Media.find({ section_id: req.params.id });

  if (!media)
    return res.send({
      code: 400,
      message: "invalid section, please put a valid section id to get media",
    });

  res.send({
    code: 200,
    data: media,
  });
});

router.get("/section_quizzes/:id", ensureAuthenticated, async (req, res) => {
  const quizzes = await Quiz.find({ section_id: req.params.id });

  if (!quizzes)
    return res.send({
      code: 400,
      message: "invalid section, please put a valid section id to get quizzes",
    });

  quizzes.map((quiz) => {
    return (quiz.questions = Question.find({ section_id: quiz.section_id }));
  });

  res.send({
    code: 200,
    data: quizzes,
  });
});

router.post("/topic", ensureAuthenticated, async (req, res) => {
  try {
    let { title } = req.body;
    if (!title)
      return res.send({
        code: 400,
        message: "please enter topic title",
        data: {},
      });

    let topic = await Topic.findOne({ title });
    if (topic)
      return res.send({
        code: 400,
        message: "topic already existing, please create new",
        data: {},
      });

    topic = new Topic({
      created_by: req.userId,
      title,
    });

    let new_topic = await topic.save();

    res.send({
      code: 200,
      message: "Successfully created topic",
      data: { new_topic },
    });
  } catch (error) {
    res.send({
      code: 400,
      message: "An error occurred",
    });
  }
});

router.post("/section", ensureAuthenticated, async (req, res) => {
  try {
    let { title, description, image_link } = req.body;
    if (!title || !description || !image_link)
      return res.send({
        code: 400,
        message: "please enter all details",
        data: {},
      });

    let section = await Section.findOne({
      $or: [{ title }, { image_link }, { description }],
    });
    if (section)
      return res.send({
        code: 400,
        message: "section already existing, please create new",
        data: {},
      });

    section = new Section({
      created_by: req.userId,
      title,
      description,
      image_link,
    });

    let new_section = await section.save();

    res.send({
      code: 200,
      message: "Successfully created section",
      data: { new_section },
    });
  } catch (error) {
    console.log(error);
    res.send({
      error: error,
      code: 400,
      message: "An error occurred",
    });
  }
});

router.post("/article", ensureAuthenticated, async (req, res) => {
  try {
    let { title, section_id, category, content } = req.body;
    if (!title || !section_id || !category || !content)
      return res.send({
        code: 400,
        message: "please enter all details",
        data: {},
      });

    let article = await Article.findOne({ $or: [{ title }, { content }] });
    if (article)
      return res.send({
        code: 400,
        message: "article already existing, please create new",
        data: {},
      });

    const section = await Section.findById(section_id);
    if (!section)
      return res.send({
        code: 400,
        message: "invalid section , please pick correct section",
        data: {},
      });

    article = new Article({
      created_by: req.userId,
      title,
      section_id,
      category,
      content,
    });

    let new_article = await article.save();

    res.send({
      code: 200,
      message: "Successfully created article",
      data: { new_article },
    });
  } catch (error) {
    res.send({
      code: 400,
      message: "An error occurred,couldnt create article",
    });
  }
});

router.post("/media", ensureAuthenticated, async (req, res) => {
  try {
    let { title, section_id, type, link } = req.body;

    if (!title || !section_id || !type || !link)
      return res.send({
        code: 400,
        message: "please enter all details",
        data: {},
      });

    let media = await Media.findOne({ $or: [{ title }, { link }] });

    if (media)
      return res.send({
        code: 400,
        message: "media already existing, please create new",
        data: {},
      });

    const section = await Section.findById(section_id);

    if (!section)
      return res.send({
        code: 400,
        message: "invalid section , please pick correct section",
        data: {},
      });

    media = new Media({
      added_by: req.userId,
      title,
      section_id,
      type,
      link,
    });

    let new_media = await media.save();

    res.send({
      code: 200,
      message: "Successfully created media",
      data: { new_media },
    });
  } catch (error) {
    res.send({
      code: 400,
      message: "An error occurred, couldnt create media",
    });
  }
});

router.post("/quiz", ensureAuthenticated, async (req, res) => {
  try {
    let { section_id } = req.body;
    if (!section_id)
      return res.send({
        code: 400,
        message: "please pick a section to add quiz",
        data: {},
      });

    let quiz = await Quiz.findOne({ section_id });
    if (quiz)
      return res.send({
        code: 400,
        message: "quizzes for this section already existing, please create new",
        data: {},
      });

    const section = await Section.findOne({ _id: section_id });
    if (!section)
      return res.send({
        code: 400,
        message: "invalid section , please pick correct section",
        data: {},
      });

    quiz = new Quiz({
      created_by: req.userId,
      section_id,
    });

    let new_quiz = await quiz.save();

    res.send({
      code: 200,
      message: "Successfully created quiz",
      data: { new_quiz },
    });
  } catch (error) {
    res.send({
      code: 400,
      message: "An error occurred",
    });
  }
});

router.post("/question", ensureAuthenticated, async (req, res) => {
  try {
    let { section_id, options, correct_option, question } = req.body;
    if (!section_id || !options || !correct_option || !question)
      return res.status(400).send({
        code: 400,
        message: "please enter all details",
        data: {},
      });

    let questn = await Question.findOne({ question });
    if (questn)
      return res.send({
        code: 400,
        message: "question already existing, please create new",
        data: {},
      });

    const section = await Section.findOne({ _id: section_id });
    if (!section)
      return res.status(400).send({
        code: 400,
        message: "invalid section , please pick correct section",
        data: {},
      });

    questn = await Question.findOne({ $and: [{ section_id }, { question }] });
    if (questn)
      return res.status(400).send({
        code: 400,
        message: `${question} already exist for this quiz, please create new or give new question`,
        data: {},
      });

    if (!Object.values(options).includes(correct_option))
      return res.status(400).send({
        code: 400,
        message: `Answer does not exist in the options provided, please make sure ${correct_option} exists in the options object`,
        data: {},
      });

    let newQuestion = new Question({
      created_by: req.userId,
      section_id,
      options,
      correct_option: correct_option,
      question,
    });

    let new_Question = await newQuestion.save();

    res.send({
      code: 200,
      message: "Successfully created new question",
      data: { new_Question },
    });
  } catch (error) {
    res.status(500).send({
      code: 500,
      message: error.message,
    });
  }
});

router.post("/result", ensureAuthenticated, async (req, res) => {
  try {
    let { score, total, quiz_id } = req.body;
    console.log({ score, total, quiz_id });
    if (score === undefined || total === undefined || quiz_id === undefined)
      return res.send({
        code: 400,
        message: "please enter all details",
        data: {},
      });

    const user_id = req.userId;
    // var res = score.replace(/% ?/g, "");
    // var testStatus = "";
    // res = parseInt(res);
    // res > 50 ? (testStatus = "Passed") : (testStatus = "failed");
    let percentage = (score * 100) / total;

    let _score = {
      quiz_id,
      percentage,
      score,
      total,
      passed: percentage >= 50,
      added_on:
        new Date().toLocaleDateString() +
        "  " +
        new Date().toLocaleTimeString(),
    };

    let result = await Result.findOne({ user_id: user_id });

    if (result) {
      let scores = result.scores;
      // Check if score with quiz_id exists
      let index = null;

      scores.find((value, i) => {
        let exists = value.quiz_id === quiz_id;
        if (exists) {
          index = i;
        }
        return exists;
      });

      if (index !== null) {
        scores[index] = _score;
        const res = await Result.updateOne(
          { user_id: user_id },
          {
            scores,
          }
        );
        console.log({ res });
      } else {
        scores.push(_score);
        result = await result.save();
      }
    } else {
      result = new Result({
        user_id,
        scores: [_score],
      });
      result = await result.save();
    }

    res.send({
      code: 200,
      message: "Successfully submitted result score",
      data: { result },
    });
  } catch (error) {
    res.send({
      code: 400,
      message: error.message,
    });
  }
});

router.get("/progress", ensureAuthenticated, async (req, res) => {
  try {
    const user_id = req.userId;
    let result = await Result.findOne({ user_id: user_id });

    res.status(200).json({
      message: "Sucessfully retrieved progress",
      data: {
        result,
      },
    });
  } catch (error) {
    res.send({
      code: 400,
      message: error.message,
    });
  }
});

router.delete("/media/:id", ensureAuthenticated, async (req, res) => {
  const media = await Media.findOneAndDelete({ _id: req.params.id });

  if (!media)
    return res.send({
      code: 401,
      message: "invalid media id, please put a valid id to delete media",
    });

  res.send({
    code: 200,
    message: "Media has been deleted",
    data: media,
  });
});

router.delete("/topic/:id", ensureAuthenticated, async (req, res) => {
  const topic = await Topic.findOneAndDelete({ _id: req.params.id });

  if (!topic)
    return res.send({
      code: 401,
      message: "invalid topic id, please put a valid id to delete topic",
    });

  res.send({
    code: 200,
    message: "Topic has been deleted",
    data: topic,
  });
});

router.delete("/section/:id", ensureAuthenticated, async (req, res) => {
  const section = await Section.findOneAndDelete({ _id: req.params.id });

  if (!section)
    return res.send({
      code: 401,
      message: "invalid section id, please put a valid id to delete section",
    });

  res.send({
    code: 200,
    message: "Section has been deleted",
    data: section,
  });
});

router.delete("/article/:id", ensureAuthenticated, async (req, res) => {
  const article = await Article.findOneAndDelete({ _id: req.params.id });

  if (!article)
    return res.send({
      code: 401,
      message: "invalid article id, please put a valid id to delete article",
    });

  res.send({
    code: 200,
    message: "Article has been deleted",
    data: article,
  });
});

router.delete("/question/:id", ensureAuthenticated, async (req, res) => {
  const question = await Question.findOneAndDelete({ _id: req.params.id });

  if (!question)
    return res.send({
      code: 401,
      message: "invalid question id, please put a valid id to delete question",
    });

  res.send({
    code: 200,
    message: "Question has been deleted",
    data: question,
  });
});

router.put("/section/:id", ensureAuthenticated, async (req, res) => {
  try {
    const update = req.body;
    const section = await Section.findOneAndUpdate(
      { _id: req.params.id },
      { $set: update },
      { new: true }
    );

    if (!section)
      return res.send({
        code: 401,
        message: "Section does not exist",
        data: {},
      });

    res.send({
      code: 200,
      message: "Section Updated",
      data: section,
    });
  } catch (error) {
    res.send({
      code: 400,
      message: "An error occurred",
    });
  }
});

router.put("/question/:id", ensureAuthenticated, async (req, res) => {
  try {
    const update = req.body;
    const question = await Question.findOneAndUpdate(
      { _id: req.params.id },
      { $set: update },
      { new: true }
    );

    if (!question)
      return res.send({
        code: 401,
        message: "Question does not exist",
        data: {},
      });

    res.send({
      code: 200,
      message: "Question Updated",
      data: question,
    });
  } catch (error) {
    res.send({
      code: 400,
      message: "An error occurred",
    });
  }
});

router.put("/media/:id", ensureAuthenticated, async (req, res) => {
  try {
    const update = req.body;
    const media = await Media.findOneAndUpdate(
      { _id: req.params.id },
      { $set: update },
      { new: true }
    );

    if (!media)
      return res.send({
        code: 401,
        message: "Media does not exist",
        data: {},
      });

    res.send({
      code: 200,
      message: "Media Updated",
      data: media,
    });
  } catch (error) {
    res.send({
      code: 400,
      message: "An error occurred",
    });
  }
});

router.put("/topic/:id", ensureAuthenticated, async (req, res) => {
  try {
    const update = req.body;
    const topic = await Topic.findOneAndUpdate(
      { _id: req.params.id },
      { $set: update },
      { new: true }
    );

    if (!topic)
      return res.send({
        code: 401,
        message: "Topic does not exist",
        data: {},
      });

    res.send({
      code: 200,
      message: "Topic Updated",
      data: topic,
    });
  } catch (error) {
    res.send({
      code: 400,
      message: "An error occurred",
    });
  }
});

router.put("/article/:id", ensureAuthenticated, async (req, res) => {
  try {
    const update = req.body;
    const article = await Article.findOneAndUpdate(
      { _id: req.params.id },
      { $set: update },
      { new: true }
    );

    if (!article)
      return res.send({
        code: 401,
        message: "Article does not exist",
        data: {},
      });

    res.send({
      code: 200,
      message: "Article Updated",
      data: article,
    });
  } catch (error) {
    res.send({
      code: 400,
      message: "An error occurred",
    });
  }
});

router.post("/subscription/", ensureAuthenticated, async (req, res) => {
  try {
    let { plan, amount, duration } = req.body;
    if (!plan || !amount || !duration)
      return res.send({
        code: 402,
        message: "please enter all details",
        data: {},
      });

    let sub = await Subscription.findOne({ $or: [{ plan }, { amount }] });
    if (sub)
      return res.send({
        code: 402,
        message:
          "Subscription already existing with the same plan and amount, please create new",
        data: {},
      });

    sub = new Subscription({
      createdBy: req.userId,
      plan,
      amount,
      duration,
    });

    let result = await sub.save();

    res.send({
      code: 200,
      message: "Successfully created section",
      data: { result },
    });
  } catch (error) {
    res.send({
      code: 401,
      message: `An error occurred ${error}`,
    });
  }
});

router.get("/subscription/", ensureAuthenticated, async (req, res) => {
  try {
    const subs = await Subscription.find();
    res.send({
      code: 200,
      data: subs,
    });
  } catch (error) {
    res.send({
      code: 401,
      message: "An error occurred",
    });
  }
});

router.put("/subscription/:id", ensureAuthenticated, async (req, res) => {
  try {
    const update = req.body;
    const sub = await Subscription.findOneAndUpdate(
      { _id: req.params.id },
      { $set: update },
      { new: true }
    );

    if (!sub)
      return res.send({
        code: 401,
        message: "Subscription does not exist",
        data: {},
      });

    res.send({
      code: 200,
      message: "Subscription Updated",
      data: sub,
    });
  } catch (error) {
    res.send({
      code: 401,
      message: "An error occurred",
    });
  }
});

router.delete("/subscription/:id", ensureAuthenticated, async (req, res) => {
  try {
    const sub = await Subscription.findOneAndDelete({ _id: req.params.id });
    if (!sub)
      return res.send({
        code: 401,
        message:
          "invalid Subscription id, please put a valid id to delete subscription",
      });

    res.send({
      code: 200,
      message: "Subscription has been deleted",
      data: sub,
    });
  } catch (error) {
    res.send({
      code: 401,
      message: "An error occurred",
    });
  }
});

router.post("/articleRead", ensureAuthenticated, async (req, res) => {
  try {
    let { isRead, articleId } = req.body;
    if (!isRead || !articleId)
      return res.send({
        code: 400,
        message: "please enter all details",
        data: {},
      });

    const user_id = req.userId;
    const article = await Article.findOne({ _id: articleId });

    let freshread = {
      isRead,
      articleId,
      Added_on:
        new Date().toLocaleDateString() +
        "  " +
        new Date().toLocaleTimeString(),
    };
    let result = await ReadArticle.findOne({ user_id: user_id });
    if (result) {
      let read = result.read;
      read.push(freshread);
    } else {
      result = new ReadArticle({
        user_id,
        read: [freshread],
      });
    }

    let new_result = await result.save();

    res.send({
      code: 200,
      message: `You just finish reading ${article.title}`,
      data: { new_result },
    });
  } catch (error) {
    res.send({
      code: 400,
      message: `An error occurred ${error}`,
    });
  }
});

module.exports = router;
