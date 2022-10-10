import compilerConfig from "#root/compiler.config.js";
import fs from "fs";
import postCSS from "postCSS";
import tailwindcss from "tailwindcss";
// import tailwindConfig from "#root/tailwind.config.cjs";
import autoprefixer from "autoprefixer";
import cssNano from "cssnano";
import cssNanoPresetAdvanced from "cssnano-preset-advanced";

export function consoleError(message) {
  if (compilerConfig.log.errors)
    console.error("\x1b[31mError:\x1b[0m ", message);
}

export function consoleWarn(message) {
  if (compilerConfig.log.warnings)
    console.log("\x1b[33mWarn:\x1b[0m  ", message);
}

export async function generateMainCSS() {
  // Generate the main CSS present in all files
  const rawMainCSS = fs.readFileSync("./src/main.css", "utf-8");
  const mainCSS = (
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
      .process(rawMainCSS, { from: "./src/main.css" })
  ).css;

  return mainCSS;
}
