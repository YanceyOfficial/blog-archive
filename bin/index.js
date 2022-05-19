const path = require("path");
const { promises: fsPromises } = require("fs");

const ignores = ["bin", "LICENSE", "README.md", ".git"];

const generateMenu = async () => {
  const dirs = await fsPromises.readdir(path.join(__dirname, "../"));
  let res = "# 目录\n";

  dirs.forEach(async (dir) => {
    if (!ignores.includes(dir)) {
      const fileNames = await fsPromises.readdir(
        path.join(__dirname, "../", dir)
      );

      const template = `
- ${dir}
  ${fileNames
    .map(
      (fileName) =>
        `- [${fileName.replace(/\.mdx?/, "")}](./${encodeURI(dir)}/${encodeURI(
          fileName
        )})`
    )
    .join("\n  ")}
`;

      res += template;
    }

    await fsPromises.writeFile(path.join(__dirname, "../README.md"), res);
  });
};

generateMenu();
