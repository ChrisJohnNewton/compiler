// import { performance } from "perf_hooks";

import "dotenv/config";
import { createPosts, removeDeletedPosts } from "./lib/posts/functions.js";
import { generateMainCSS } from "./lib/general/functions.js";

const mainCSS = await generateMainCSS();
createPosts(mainCSS);
removeDeletedPosts();
