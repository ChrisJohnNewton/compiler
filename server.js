// import fs from "fs";
import express from "express";
// import { execSync } from "child_process";
const app = express();
const port = 3000;
// import liveReload from "livereload";
// import connectLiveReload from "connect-livereload";

// const liveReloadServer = liveReload.createServer();
// liveReloadServer.watch("dist");
// liveReloadServer.server.once("connection", () => {
//   setTimeout(() => {
//     liveReloadServer.refresh("/");
//   }, 100);
// });
// app.use(connectLiveReload());

// execSync("pnpm run build");

// app.use("/*", (request, response, next) => {
//   const baseURL = request.baseUrl;
//   const page = fs.readFileSync(`dist${baseURL}.html`, "utf-8");

//   response.send(page);
// });

app.use(express.static("dist"));

app.listen(port, () => {
  console.log(`Server is running at: http://localhost:${port}/`);
});
