const http = require("http");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const dailyLogDir = path.join(__dirname, "logs");
const publicDir = path.join(__dirname, "public");

const server = http.createServer(async (request, response) => {
  const url = request.url;

  switch (url) {
    case "/about":
      console.log("About page requested");
      await respondWithHTML(response, "views/about.html");
      break;
    case "/contact":
      console.log("Contact page requested");
      await respondWithHTML(response, "views/contact.html");
      break;
    case "/products":
      console.log("Products page requested");
      await respondWithHTML(response, "views/products.html");
      break;
    case "/subscribe":
      console.log("Subscribe page requested");
      await respondWithHTML(response, "views/subscribe.html");
      break;
    case "/daily-info":
      console.log("Daily info page requested");
      displayDailyInfo(response);
      break;
    case "/styles.css":
      console.log("CSS file requested");
      await respondWithCSS(response, "styles.css");
      break;
    default:
      console.log("Home page requested");
      await respondWithHTML(response, "views/home.html");
      break;
  }

  emitRouteAccessedEvent(url);
});

async function respondWithHTML(response, filePath) {
  try {
    const data = await fs.promises.readFile(filePath, "utf8");

    response.writeHead(200, { "Content-Type": "text/html" });
    response.end(data);
  } catch (error) {
    console.error(`Error reading file: ${filePath}`, error);
    response.writeHead(500, { "Content-Type": "text/plain" });
    response.end("Internal Server Error");
  }
}

async function respondWithCSS(response, filePath) {
  try {
    const data = await fs.promises.readFile(
      path.join(publicDir, filePath),
      "utf8",
    );

    response.writeHead(200, { "Content-Type": "text/css" });
    response.end(data);
  } catch (error) {
    console.error(`Error reading file: ${filePath}`, error);
    response.writeHead(500, { "Content-Type": "text/plain" });
    response.end("Internal Server Error");
  }
}

const EventEmitter = require("events");
const myEmitter = new EventEmitter();

myEmitter.on("routeAccessed", async (route) => {
  try {
    const logMessage = `Route "${route}" was accessed`;

    console.log(logMessage);
    await writeToLog(logMessage);
  } catch (error) {
    console.error("Error writing to log:", error);
  }
});

function emitRouteAccessedEvent(url) {
  myEmitter.emit("routeAccessed", url);
}

async function createLogFile() {
  try {
    const now = new Date();
    const dateStamp = now.toISOString().slice(0, 10);
    const logFileName = `log_${dateStamp}.txt`;
    const logFilePath = path.join(dailyLogDir, logFileName);

    try {
      await fs.promises.access(dailyLogDir);
    } catch (error) {
      await fs.promises.mkdir(dailyLogDir);
    }

    try {
      await fs.promises.access(logFilePath);
    } catch (error) {
      await fs.promises.writeFile(logFilePath, "");
    }

    return fs.createWriteStream(logFilePath, { flags: "a" });
  } catch (error) {
    console.error("Error creating log file:", error);
    throw error;
  }
}

async function writeToLog(logMessage) {
  try {
    const logStream = await createLogFile();

    logStream.write(logMessage);
    logStream.end();
  } catch (error) {
    console.error("Error writing to log:", error);
    throw error;
  }
}

async function displayDailyInfo(response) {
  try {
    // Fetch daily information from an API or using a package
    const dailyInfo = await fetchDailyInfo();

    response.writeHead(200, { "Content-Type": "text/html" });

    if (dailyInfo) {
      response.write("<h1>Daily Information</h1>");
      response.write("<ul>");

      dailyInfo.forEach((info) => {
        response.write(`<li>${info}</li>`);
      });

      response.write("</ul>");
      response.write("<a href='/'>Return to Home Page</a>");
    } else {
      response.write("<p>No daily information available</p>");
      response.write("<a href='/'>Return to Home Page</a>");
    }
  } catch (error) {
    console.error("Error fetching daily info:", error);
    response.writeHead(500, { "Content-Type": "text/plain" });
    response.write("Internal Server Error");
  }

  response.end();
}

async function fetchDailyInfo() {
  try {
    const response = await axios.get("https://newsapi.org/v2/top-headlines", {
      params: {
        country: "us", // Specify the country for news
        category: "technology", // Specify the category for news
        apiKey: "cdc99d3510d143669d0e7c7b87a60543",
      },
    });

    // Extract the relevant news information from the response
    const articles = response.data.articles;
    const news = articles.map((article) => article.title);

    return news;
  } catch (error) {
    console.error("Error fetching daily news:", error);
    throw error;
  }
}

server.listen(8080, () => {
  console.log("Server listening on port 8080");
});
