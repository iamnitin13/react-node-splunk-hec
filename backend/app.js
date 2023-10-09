require("dotenv").config();
const express = require("express");
const http = require("http");
const https = require("https");
const cors = require("cors");
const app = express();
const axios = require("axios");
const validateData = require("./sampleuser.json");

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = validateData.find(
      (data) => data.email === email && data.password === password
    );
    const msg = user ? "User Logging Success" : "User Logging failed";
    delete user?.password;
    const result = {
      ...user,
      email,
      success: !!user,
      date: new Date(),
      msg,
    };
    const { status, data } = await axios({
      url: `${process.env.HEC_URL}/services/collector/event`,
      method: "POST",
      headers: {
        Authorization: `Splunk ${process.env.HEC_TOKEN}`,
      },
      data: JSON.stringify({ event: result }),
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });
    console.log("<<RESPONSE>>", data);
    res.status(200).send({ data, success: result.success });
  } catch (error) {
    next(error);
  }
});

app.use((err, req, res, next) => {
  console.log("<<<ERROR>>", err);
  const { status, data } = err.response;
  res.status(status).send(data);
});

const server = http.createServer(app);
server.listen(4000, (err) => {
  if (!err) console.log(`Server Started at localhost:${4000}`);
});

module.exports = app;
