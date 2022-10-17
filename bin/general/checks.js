import projectRoot from "app-root-path";
import {
  consoleYellow,
  consoleRed,
  consoleWarn,
  consoleError,
} from "#general/console.js";
import { simplifyPath } from "#general/helpers.js";
import fs from "fs";

global.root = projectRoot.path;

try {
  // Try and grab the user's config file from THEIR project root.
  global.config = (await import(`${global.root}/compiler.config.js`)).default;
} catch (error) {
  // Grab the default config file from the NPM project root. #root is defined in package.json and is the PACKAGE's root.
  global.config = (await import("#root/compiler.config.js")).default;
  consoleWarn(
    `No compiler config file found, using the default settings: ${consoleYellow(
      "https://github.com/ChrisJohnNewton/compiler/blob/main/compiler.config.js"
    )}`
  );
}

try {
  global.tailwind = (
    await import(`${global.root}/${simplifyPath(global.config.css.tailwind)}`)
  ).default;
} catch (error) {
  global.tailwind = await import(`#root/tailwind.config.js`);
  consoleWarn(
    `No Tailwind CSS config file found, using the default settings: ${consoleYellow(
      global.config.css.tailwind
    )}`
  );
}

export default function preCheck() {
  const isPostsDirectoryOk = postsDirectoryCheck();
  const isPagesDirectoryOk = pagesDirectoryCheck();
  const isTailwindConfigOk = tailwindConfigCheck();

  // Do not console log anything specific here. The individual checks console any specific errors as they arise.
  if (!isPostsDirectoryOk || !isPagesDirectoryOk || !isTailwindConfigOk) {
    console.error(consoleRed("Compiler shut down."));
    process.exit();
  }
}

function postsDirectoryCheck() {
  const isPostsKeySet = global.config.posts;
  const doesPostsDirectoryExist = fs.existsSync(
    `${global.root}/${simplifyPath(global.config.posts)}`
  );

  if (isPostsKeySet && doesPostsDirectoryExist)
    return `${global.root}/${simplifyPath(global.config.posts)}`;

  if (!isPostsKeySet)
    consoleError(`No "posts" key has been added to your config file.`);
  else if (!doesPostsDirectoryExist)
    consoleError(
      `No "posts" directory exists in the place the compiler config file states it does, which is here: ${consoleRed(
        global.config.posts
      )}`
    );
}

function pagesDirectoryCheck() {
  const isPagesKeySet = global.config.pages;
  const doesPagesDirectoryExist = fs.existsSync(
    `${global.root}/${simplifyPath(global.config.pages)}`
  );

  if (isPagesKeySet && doesPagesDirectoryExist)
    return `${global.root}/${simplifyPath(global.config.pages)}`;

  if (!isPagesKeySet)
    consoleError(`No "pages" key has been added to your config file.`);
  else if (!doesPagesDirectoryExist)
    consoleError(
      `No "pages" directory exists in the place the compiler config file states it does, which is here: ${consoleRed(
        global.config.pages
      )}`
    );
}

function tailwindConfigCheck() {
  const isTailwindKeySet = global.config.css.tailwind;
  const doesTailwindConfigExist = fs.existsSync(
    `${global.root}/${simplifyPath(global.config.css.tailwind)}`
  );

  if (!isTailwindKeySet)
    consoleError(`No "tailwind" key has been added to your config file.`);
  else if (!doesTailwindConfigExist)
    consoleError(
      `No Tailwind CSS config file exists in the place the compiler config file states it does, which is here: ${consoleRed(
        global.config.css.tailwind
      )}`
    );
}

async function getTailwindConfig(boolean) {
  if (boolean)
    return (
      await import(`${global.root}/${simplifyPath(global.config.css.tailwind)}`)
    ).default;
  else return await import(`#root/tailwind.config.js`);
}
