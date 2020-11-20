require("dotenv").config();
const connectDB = require("./util/db");

const cors = require('cors')
const app = require("express")();

//db connection
connectDB().then(() => {
  app.use(cors())
  app.use((req, res, next) => {
    console.log("Request URL:", req.url);
    try {
      next();
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  });
  require("./util/routes")(app);


  const port = process.env.PORT || 3000;
  console.log({ environment: app.settings.env });
  app.listen(port, () =>
    console.log(`listening on port http://localhost:${port}`)
  );
});
