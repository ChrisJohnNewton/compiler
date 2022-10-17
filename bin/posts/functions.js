import fs, { writeFileSync } from "fs";
import path from "path";
import matter from "gray-matter";
import {
  sourcePostsDirectory,
  destinationPostsDirectory,
  sourcePostNames,
  destinationPostNames,
  getPostHTMLTemplate,
  getPostJSXTemplate,
  getAllPosts,
  getPostData,
  generateHead,
  generatePostSchema,
  generateJSX,
  generateAMPHTML,
  generateLayoutCSS,
  // generateAMPJS,
} from "./helpers.js";

// Create dist posts from source posts
export async function createPosts(mainCSS) {
  const postsToBeCreated = getAllPosts();

  if (postsToBeCreated?.length) {
    const ampTemplate = await getPostHTMLTemplate();
    const layoutPath = path.join(process.cwd(), "src/layouts/post.js");
    const JSX = await generateJSX(layoutPath);
    const CSS = mainCSS + (await generateLayoutCSS(JSX));
    // const ampJS = await generateAMPJS();

    postsToBeCreated.forEach(async (post, index) => {
      const postData = await getPostData(post);
      const postSlug = postData.slug.replace(" ", "-");
      const postSchema = generatePostSchema(postData);
      const postCSS = CSS + postData.css;

      const article = JSX.replace(
        /<article(.*)><\/article>/,
        `<article$1>${postData.html}</article>`
      );

      const fileHTML = generateHead(ampTemplate, postData, postSchema)
        .replace("</head>", `<style amp-custom>${postCSS}</style></head>`)
        .replace(`<body id="start">`, `<body>${article}`);

      const ampHTML = await generateAMPHTML(fileHTML);

      fs.writeFileSync(
        path.join(process.cwd(), `dist/${postSlug}.html`),
        ampHTML
      );

      console.log(`✅ \x1b[32m${index + 1}. ${postSlug}.html\x1b[0m`);
    });
  }
}

// Removes posts from the dist directory that no longer have a corresponding source
export async function removeDeletedPosts() {
  const sourcePosts = await (
    await fs.promises.readdir(sourcePostsDirectory)
  ).map((file) => path.parse(file).name);

  const postsToBeDeleted = destinationPostNames.filter(
    (destinationPost) => !sourcePosts.includes(destinationPost)
  );

  const directoryJSXFileCount = postsToBeDeleted.filter((item) =>
    item.includes("jsx")
  ).length;

  console.log(
    `\x1b[31mPosts to be deleted: ${
      postsToBeDeleted.length - directoryJSXFileCount
    }\x1b[0m`
  );

  // Iterate over posts to be deleted and call fs.unlinkSync to remove each one
  postsToBeDeleted.forEach((post, index) => {
    const destinationPostPath = path.join(
      destinationPostsDirectory,
      `${post}.html`
    );
    fs.unlinkSync(destinationPostPath);
    if (!post.includes("jsx"))
      console.log(`❌ \x1b[31m${index + 1}. ${post}.html\x1b[0m`);
  });
}

// Returns the posts sorted by date
export function getSortedPostsData() {
  const allPostsData = sourcePostNames.map((post) => {
    // Read markdown file as string
    const sourcePostPath = path.join(sourcePostsDirectory, `${post}.md`);
    const sourcePostContents = fs.readFileSync(sourcePostPath, "utf8");

    // Use gray-matter to parse the post metadata section
    const matterResult = matter(sourcePostContents);

    // Combine the data with the post
    return {
      post,
      ...matterResult.data,
    };
  });
  // Sort posts by date
  return allPostsData.sort(({ date: a }, { date: b }) => {
    if (a < b) {
      return 1;
    } else if (a > b) {
      return -1;
    } else {
      return 0;
    }
  });
}
