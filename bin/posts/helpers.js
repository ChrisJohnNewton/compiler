import fs, { writeFileSync } from "fs";
import path from "path";
import { execSync } from "child_process";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkDirective from "remark-directive";
import remarkGFM from "remark-gfm";
import remarkRehype from "remark-rehype";
import { customHTMLRemarkPlugin as customHTMLRemarkPlugin } from "../lib/plugins.js";
import rehypeFormat from "rehype-format";
import rehypeStringify from "rehype-stringify";
import { minify as htmlMinify } from "html-minifier";
import reactDOMServer from "react-dom/server";
import postCSS from "postCSS";
import tailwindcss from "tailwindcss";
// import tailwindConfig from "#root/tailwind.config.cjs";
import autoprefixer from "autoprefixer";
import cssNano from "cssnano";
import cssNanoPresetAdvanced from "cssnano-preset-advanced";
import AmpOptimizer from "@ampproject/toolbox-optimizer";
const ampOptimizer = AmpOptimizer.create();

// Variables used inside functions
export const ampScriptsDirectory = path.join(process.cwd(), "src/scripts/amp");
export const sourcePostsDirectory = path.join(process.cwd(), "src/posts");
export const destinationPostsDirectory = path.join(process.cwd(), "dist");
export const sourcePostNames = await fs.promises
  .readdir(sourcePostsDirectory)
  .then((files) => {
    const modifiedFiles = files.filter((file) => {
      const modifiedDate = formatDate(
        fs.statSync(`${sourcePostsDirectory}/${file}`).mtime
      );

      if (modifiedDate === formatDate(Date.now())) {
        const filename = path.parse(file).name;
        if (filename !== ".DS_Store") return filename;
      }
    });

    return modifiedFiles.map((file) => path.parse(file).name);
  });
export const destinationPostNames = await fs.promises
  .readdir(destinationPostsDirectory)
  .then((files) => {
    return files
      .map((file) => {
        const filename = path.parse(file).name;
        const extension = path.parse(file).ext;
        if (extension === ".html") {
          return filename !== ".DS_Store" && filename;
        }
      })
      .filter(Boolean);
  });

// Returns all the posts that are needing to be created in the dist directory
export function getAllPosts() {
  const postsToBeCreated = [];

  if (sourcePostNames?.length) {
    // Remove source post from posts needing to be created if it hasn't been updated
    postsToBeCreated.push(
      ...sourcePostNames.filter((sourcePost) => {
        // Check post exists in dist directory
        const destinationFileExists = fs.existsSync(
          `${destinationPostsDirectory}/${sourcePost}.html`
        );
        // If not, make sure to include it in the list by returning true (See how filter function works if confused: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter)
        if (!destinationFileExists) return true;

        // Get the source post's modified time
        const sourcePostModifiedTime = fs.statSync(
          `${sourcePostsDirectory}/${sourcePost}.md`
        ).mtimeMs;

        // Get the destination post's created time
        const destinationPostCreatedTime = fs.statSync(
          `${destinationPostsDirectory}/${sourcePost}.html`
        ).ctimeMs;

        // Include posts whose source is more recent than its distributed version
        return destinationPostCreatedTime < sourcePostModifiedTime;
      })
    );
  }

  if (postsToBeCreated.length === 0) postsToBeCreated.push("dev-post");

  // Remove duplicates
  const finalPostsToBeCreated = [...new Set(postsToBeCreated)];
  console.log(
    "\x1b[33mReminder:\x1b[0m Only posts that have been modified today will be created."
  );
  console.log(
    `\x1b[32mPosts to be created: ${finalPostsToBeCreated.length}\x1b[0m`
  );

  return finalPostsToBeCreated;
}

// Gets the post AMP HTML template and minifies it ready for use
export async function getPostHTMLTemplate() {
  // Get amp.html into a variable
  const postTemplate = fs.readFileSync(
    path.join(process.cwd(), "src/templates/post/amp.html"),
    "utf8"
  );

  // Minify it
  const postTemplateMinified = htmlMinify(postTemplate, {
    collapseWhitespace: true,
    removeComments: true,
  });

  return postTemplateMinified;
}

export function getPostJSXTemplate() {
  // Get layouts/posts.js into a variable
  const postTemplate = fs.readFileSync(
    path.join(process.cwd(), "src/layouts/post.js"),
    "utf8"
  );

  return postTemplate;
}

// Returns the post data of source posts that are needing to be created in the dist directory
export async function getPostData(post) {
  const sourcePostPath = path.join(sourcePostsDirectory, `${post}.md`);
  const sourcePostContents = fs.readFileSync(sourcePostPath, "utf8");

  // Use gray-matter to parse the post and metadata section
  const matterResult = matter(sourcePostContents);

  // Use remark to convert markdown into HTML string
  let HTML = await unified() // A tool that transforms markdown with plugins
    .use(remarkParse)
    .use(remarkDirective)
    .use(customHTMLRemarkPlugin)
    .use(remarkGFM)
    .use(remarkRehype)
    .use(rehypeFormat)
    .use(rehypeStringify)
    .process(matterResult.content);

  let componentCSS = "";

  // Generate component JSX, if component filler statements exist
  try {
    const matches = HTML.value.matchAll(/<component.*<\/component>/g);
    const totalMatches = Array.from(matches);
    const componentJSX = await generateComponentJSX(totalMatches);
    const componentJSXJoined = componentJSX.join();

    totalMatches.forEach((match, index) => {
      // Replace the component filler statements with its respective JSX
      HTML.value = HTML.value.replace(match[0], componentJSX[index]);
    });

    // Generate the CSS for the components in one step
    componentCSS += await generatePostCSS(componentJSXJoined);
  } catch (e) {
    new Error(e);
  }

  const minifiedHTML = htmlMinify(HTML.value, {
    collapseWhitespace: true,
    removeComments: true,
  });

  // Combine the data with the post
  return {
    slug: post,
    html: minifiedHTML,
    css: componentCSS,
    ...matterResult.data,
  };
}

export function generateHead(ampTemplate, postData, postSchema) {
  return ampTemplate.replace(
    `<title></title><meta name="description" content=""><link rel="canonical" href=""><meta property="article:published_time" content=""><meta property="article:modified_time" content=""><meta property="og:updated_time" content=""><meta property="og:title" content=""><meta property="og:description" content=""><meta property="og:url" content=""><meta property="og:image" content=""><meta property="og:image:alt" content=""><meta name="twitter:image" content=""><meta name="twitter:image:alt" content=""><meta name="twitter:card" content="summary_large_image"><meta name="author" content=""><meta property="article:author" content=""><meta property="article:publisher" content=""><meta name="twitter:creator" content="@"><meta name="theme-color" content=""><meta property="og:site_name" content=""><meta name="twitter:site" content="@"><meta property="og:type" content="website"><meta property="og:locale" content="en_US"><link rel="icon" sizes="any" href="./favicon.ico"><link rel="icon" href="./favicon.svg"><link rel="apple-touch-icon" href="./apple-touch-icon.png"><link rel="webmention" href=""><link rel="pingback" href=""><link rel="manifest" href="./manifest.json"><script type="application/ld+json"></script>`,
    `<title>${postData.title}</title><meta name="description" content="${
      postData.description
    }"><link rel="canonical" href="${process.env.PROTOCOL}${
      process.env.HOST_NAME
    }/${postData.slug}"><meta property="article:published_time" content="${
      postData.publishedTime
    }"><meta property="article:modified_time" content="${formatDate(
      Date.now()
    )}"><meta property="og:updated_time" content="${formatDate(
      Date.now()
    )}"><meta property="og:title" content="${
      postData.title
    }"><meta property="og:description" content="${
      postData.description
    }"><meta property="og:url" content="${process.env.PROTOCOL}${
      process.env.HOST_NAME
    }/${postData.slug}"><meta property="og:image" content="${
      postData.image
    }"><meta name="twitter:image" content="${
      postData.image
    }"><meta property="og:image:alt" content="${
      postData.imageAlt
    }"><meta name="twitter:image:alt" content="${
      postData.imageAlt
    }"><meta name="twitter:card" content="summary_large_image"><meta name="author" content="${
      process.env.AUTHOR
    }"><meta property='article:author' content="https://www.facebook.com/${
      process.env.AUTHOR_SOCIAL_USERNAME
    }"><meta property='article:publisher' content="https://www.facebook.com/${
      process.env.SITE_SOCIAL_USERNAME
    }"><meta name="twitter:creator" content="@${
      process.env.SITE_SOCIAL_USERNAME
    }"><meta name="theme-color" content="${
      process.env.THEME_COLOUR
    }"><meta property="og:site_name" content="${
      process.env.SITE_NAME
    }"><meta name="twitter:site" content="@${
      process.env.SITE_SOCIAL_USERNAME
    }"><meta property="og:type" content="website"><meta property="og:locale" content="en_US"><link rel="icon" sizes="any" href="./favicon.ico"><link rel="icon" href="./favicon.svg"><link rel="apple-touch-icon" href="./apple-touch-icon.png"><link rel="webmention" href="https://webmention.io/${
      process.env.HOST_NAME
    }/webmention"><link rel="pingback" href="https://webmention.io/${
      process.env.HOST_NAME
    }/xmlrpc"><link rel="manifest" href="./manifest.json"><script type="application/ld+json">${postSchema}</script>`
  );
}

export function generatePostSchema(postData) {
  return `{"@context":"https://schema.org","@type":"BlogPosting","mainEntityOfPage":{"@type":"WebPage","@id":"${
    process.env.PROTOCOL
  }${process.env.HOST_NAME}/${postData.slug}/"},"headline":"${
    postData.title
  }","description":"${postData.description}","image":"${
    postData.image
  }","author":{"@type":"Person","name":"${
    process.env.AUTHOR
  }"},"publisher":{"@type":"Organization","name":"${
    process.env.SITE_NAME
  }","logo":{"@type":"ImageObject","url":"${process.env.PROTOCOL}${
    process.env.HOST_NAME
  }/favicon.svg"}},"datePublished":"${
    postData.publishedTime
  }","dateModified":"${formatDate(Date.now())}"}`;
}

export async function generateJSX(filePath, props) {
  const component = (await import(filePath)).default;

  let JSX;
  if (props) {
    JSX = reactDOMServer.renderToStaticMarkup(component(props));
  } else {
    JSX = reactDOMServer.renderToStaticMarkup(component());
  }
  return JSX;
}

export async function generateComponentJSX(totalMatches) {
  const componentJSX = [];
  const propsObject = [];
  const srcArray = [];

  totalMatches.forEach((match) => {
    // Get the props keys and remove the equals sign at the end
    const propsKeys = match[0]
      .match(/[^ ]+?=/g)
      .map((match) => match.slice(0, -1));
    // shift() remove [0] from the array
    propsKeys.shift();

    // Receive the matches and assign it to propsValues - shift() will be invoked on it later and will remove the src
    const propsValues = match[0]
      .match(/"(.*?)"/g)
      .map((match) => match.replaceAll('"', ""));
    // shift() remove [0] from the array while also returning it and storing it inside the srcArray
    srcArray.push(propsValues.shift());

    let prop = {};
    propsKeys.forEach((key, index) => {
      Object.assign(prop, { [key]: propsValues[index] });
    });
    propsObject.push(prop);
  });

  let counter = 0;
  for (const prop of propsObject) {
    componentJSX.push(
      await generateJSX(`#components/${srcArray[counter]}`, prop)
    );
    counter++;
  }

  return componentJSX;
}

export async function generateAMPHTML(HTML) {
  const ampHTML = await ampOptimizer.transformHtml(HTML, {
    autoAddMandatoryTags: true,
    esmModulesEnabled: true,
    markdown: true,
    minify: true,
    verbose: true,
  });
  return ampHTML;
}

// export async function generateMainCSS() {
//   const doesMainCSSExist = fs.existsSync("./dist/main.css");

//   if (!doesMainCSSExist) {
//     // Generate the main CSS present in all files
// const rawMainCSS = fs.readFileSync("src/main.css", "utf-8");
// const mainCSS = (
//   await postCSS()
//     .use(
//       cssNano(
//         cssNanoPresetAdvanced({
//           discardComments: {
//             removeAll: true,
//           },
//         })
//       )
//     )
//     .use(tailwindcss(tailwindConfig))
//     .use(autoprefixer)
//     .process(rawMainCSS, { from: "src/main.css" })
// ).css;

//     fs.writeFileSync("./dist/main.css", mainCSS);

//     console.log(`✅ \x1b[32mmain.css regenerated\x1b[0m`);
//   }
// }

// export async function generateMainJS() {
//   const doesJSExist = fs.existsSync("./dist/main.js");

//   if (!doesMainJSExist) {
//     // Generate the main JS present in all files
//     const rawMainJS = fs.readFileSync("src/main.js", "utf-8");
//     const mainJS = babelMinify(rawMainJS).code.replace(/;$/, "");

//     fs.writeFileSync("./dist/main.js", mainJS);

//     console.log(`✅ \x1b[32mmain.js regenerated\x1b[0m`);
//   }
// }

export async function generateLayoutCSS(JSX) {
  const doesLayoutCSSExist = fs.existsSync("./src/layouts/post.css");

  let layoutCSS = "";
  if (doesLayoutCSSExist) {
    // Generate the layout CSS present in all posts
    const rawLayoutCSS = fs.readFileSync("./src/layouts/post.css", "utf-8");
    layoutCSS = (
      await postCSS()
        .use(
          cssNano(
            cssNanoPresetAdvanced({
              discardComments: {
                removeAll: true,
              },
            })
          )
        )
        // .use(tailwindcss(tailwindConfig))
        .use(tailwindcss())
        .use(autoprefixer)
        .process(rawLayoutCSS, { from: "./src/layouts/post.css" })
    ).css;
  }

  // Write the JSX to a file so that Tailwind can parse it
  writeFileSync("./dist/jsx.html", JSX);

  // Generate the CSS
  const rawJSXCSS = execSync(
    `npx tailwindcss --content "./dist/jsx.html" --config "./tailwind.config.cjs"`,
    { encoding: "utf-8" }
  );

  // If it exists, remove the JSX file because it is no longer needed
  try {
    fs.unlinkSync("./dist/jsx.html");
  } catch {}

  // Use PostCSS to transform the CSS
  const JSXCSS = (
    await postCSS()
      .use(
        cssNano(
          cssNanoPresetAdvanced({
            discardComments: {
              removeAll: true,
            },
          })
        )
      )
      .use(autoprefixer)
      .process(rawJSXCSS, { from: undefined })
  ).css;
  // .replaceAll(":not(:where([class~=not-prose] *))", "")
  // .replaceAll(/\.prose-base.*?}/gs, "")
  // .replaceAll(/\.prose-xl.*?}/gs, "");

  const CSS = layoutCSS + JSXCSS;
  return CSS;
}

export async function generatePostCSS(componentJSX) {
  // Write the JSX to a file so that Tailwind can parse it
  writeFileSync("./dist/component-jsx.html", componentJSX);

  // Generate the CSS
  const rawComponentCSS = execSync(
    `npx tailwindcss --input "./lib/general/blank.css" --content "./dist/component-jsx.html" --config "./tailwind.config.cjs"`,
    { encoding: "utf-8" }
  );

  // If it exists, remove the JSX file because it is no longer needed
  try {
    fs.unlinkSync("./dist/component-jsx.html");
  } catch {}

  // Use PostCSS to transform the CSS
  const componentCSS = (
    await postCSS()
      .use(
        cssNano(
          cssNanoPresetAdvanced({
            discardComments: {
              removeAll: true,
            },
          })
        )
      )
      .use(autoprefixer)
      .process(rawComponentCSS, { from: undefined })
  ).css;

  return componentCSS;
}

// export async function generateAMPJS() {
//   const ampScripts = await fs.promises.readdir(ampScriptsDirectory);

//   // let ampScriptHashes = "";
//   let ampScriptBlocks = "";

//   for await (const ampScript of ampScripts) {
//     const ampScriptName = path.parse(ampScript).name;
//     const ampCode = await babelMinify(
//       fs.readFileSync(`${ampScriptsDirectory}/${ampScript}`, "utf-8")
//     ).code;

//     // ampScriptHashes += calculateHash(ampCode) + " ";

//     const ampScriptBlock = `<script id="${ampScriptName}" type="text/plain" target="amp-script">${ampCode}</script>`;
//     ampScriptBlocks += ampScriptBlock;
//   }

//   // const ampScriptMeta = `<meta name="amp-script-src" content="${ampScriptHashes.trim()}"/>`;

//   return ampScriptBlocks;
//   // return { meta: ampScriptMeta, blocks: ampScriptBlocks };
// }
