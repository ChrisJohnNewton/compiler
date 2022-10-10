import { consoleWarn, consoleError } from "#general/functions.js";
import compilerConfig from "#root/compiler.config.js";
import fs from "fs";

export default function isEverythingOk() {
  doesUserConfigExist();

  const isThereAProblem = new Boolean(
    !isPostsDirectoryOk() || !isPagesDirectoryOk()
  );

  // Do not console log anything specific here. The individual checks console any specific errors as they arise.
  if (isThereAProblem) {
    console.log("\n\x1b[31mCompiler shut down.\x1b[0m");
    process.exit();
  }
}

function isPostsDirectoryOk() {
  const isPostsKeySet = compilerConfig.posts;
  const doesPostsDirectoryExist = fs.existsSync(compilerConfig.posts);

  if (isPostsKeySet && doesPostsDirectoryExist) return compilerConfig.posts;

  if (!isPostsKeySet)
    consoleError(
      "\x1b[31mError:\x1b[0m ",
      `No "posts" key has been added to your config file.`
    );
  else if (!doesPostsDirectoryExist)
    consoleError(
      `No "posts" directory exists in the place the config file states it does, which is here…`,
      `\x1b[41m ${compilerConfig.posts} \x1b[0m`
    );
}

function isPagesDirectoryOk() {
  const isPagesKeySet = compilerConfig.pages;
  const doesPagesDirectoryExist = fs.existsSync(compilerConfig.pages);

  if (isPagesKeySet && doesPagesDirectoryExist) return compilerConfig.pages;

  if (!isPagesKeySet)
    consoleError(`No "pages" key has been added to your config file.`);
  else if (!doesPagesDirectoryExist)
    consoleError(
      `No "pages" directory exists in the place the config file states it does, which is here… \x1b[41m ${compilerConfig.pages} \x1b[0m`
    );
}

function doesUserConfigExist() {
  const doesUserConfigExist = fs.existsSync("#root/compiler.config.js");

  if (!doesUserConfigExist) {
    consoleWarn("No compiler config file found, using the default settings.");
  }
}

isEverythingOk();
