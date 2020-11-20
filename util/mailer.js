const nodemailer = require("nodemailer");
const mg = require("nodemailer-mailgun-transport");
const handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");
const mailgunAuth = {
  auth: {
    api_key: process.env.MAILER_API_KEY,
    domain: process.env.MAILER_DOMAIN,
  },
};

const send = async ({ mail, email, data }) => {
  const emailTemplateSource = fs.readFileSync(
    path.join(__dirname, "../mails/" + mail + ".hbs"),
    "utf8"
  );
  const smtpTransport = nodemailer.createTransport(mg(mailgunAuth));
  const template = handlebars.compile(emailTemplateSource);
  const htmlToSend = template(data);
  const mailOptions = {
    from: "support@" + process.env.MAILER_DOMAIN,
    to: email,
    subject: data.subject,
    html: htmlToSend,
  };
  return await smtpTransport.sendMail(mailOptions);
};

exports.send = send;
