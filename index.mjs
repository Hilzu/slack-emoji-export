#!/usr/bin/env node

import { promises as fs } from "fs";
import got from "got";
import FormData from "form-data";
import path from "path";

const outputPath = path.resolve("output");
const downloadPageCount = 100;

const downloadEmoji = async (emoji) => {
  const { name, url, synonyms: aliases } = emoji;
  const emojiBuffer = await got.get(url).buffer();
  const extension = path.extname(url);
  const filename = path.join(outputPath, `${name}${extension}`);
  await fs.writeFile(filename, emojiBuffer);

  for (const alias of aliases ?? []) {
    const aliasFilename = path.join(outputPath, `${alias}.png`);
    try {
      await fs.link(filename, aliasFilename);
    } catch (err) {
      if (err.code === "EEXIST") continue;
      throw err;
    }
  }
};

const main = async () => {
  const teamName = process.argv[2];
  if (!teamName) throw new Error("No team name given as argument!");

  const token = process.argv[3];
  if (!token) throw new Error("No token given as argument!");

  await fs.mkdir(outputPath, { recursive: true });

  const prefixUrl = `https://${teamName}.slack.com/api`;
  const client = got.extend({
    prefixUrl,
    retry: { limit: 5, methods: ["POST"] },
  });
  let page = 1;
  let totalPages = Number.MAX_SAFE_INTEGER;
  let totalProcessed = 0;

  while (page <= totalPages) {
    const form = new FormData();
    form.append("token", token);
    form.append("page", page);
    form.append("count", downloadPageCount);

    const res = await client.post("emoji.adminList", { body: form }).json();
    for (const emoji of res.emoji) {
      if (emoji.is_alias) continue;
      await downloadEmoji(emoji);
      totalProcessed += 1;
    }

    totalPages = res.paging.pages;
    console.log(
      `Processed page ${page} of ${totalPages}. ${totalProcessed} emoji downloaded.`
    );
    page += 1;
  }
};

try {
  await main();
} catch (err) {
  console.error("Error when running main!", err);
  process.exit(1);
}
