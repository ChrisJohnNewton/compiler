import fs from "fs";
import postCSS from "postCSS";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import cssNano from "cssnano";
import cssNanoPresetAdvanced from "cssnano-preset-advanced";

export default function generateCSS() {
  const mainCSS = generateMainCSS();
  return mainCSS;
}

async function generateMainCSS() {
  console.log(global.config);
  process.exit();

  // Generate the main CSS present in all files
  const rawMainCSS = fs.readFileSync(
    `${global.root}/${global.css.main}`,
    "utf-8"
  );
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
      .use(tailwindcss(global.tailwind))
      .use(tailwindcss())
      .use(autoprefixer)
      .process(rawMainCSS, { from: `${global.root}/${global.css.main}` })
  ).css;

  return mainCSS;
}
