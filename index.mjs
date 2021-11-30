#!/usr/bin/env node

import { promises as fs } from "fs";
import got from "got";
import FormData from "form-data";
import path from "path";

const countToDownloadPerPage = 100;

const downloadEmoji = async (emoji, outputPath) => {
  const { name, url, synonyms: aliases } = emoji;
  const emojiBuffer = await got.get(url).buffer();
  const extension = path.extname(url);
  const filename = `${name}${extension}`;
  const filePath = path.join(outputPath, filename);
  await fs.writeFile(filePath, emojiBuffer);

  for (const alias of aliases ?? []) {
    if (alias === name) continue;
    const aliasFilePath = path.resolve(outputPath, `${alias}${extension}`);
    try {
      await fs.symlink(filename, aliasFilePath);
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

  const cookieAuth = process.argv[4];
  if (!cookieAuth) throw new Error("No cookie auth given as argument!");

  const outputPath = path.resolve("output", teamName);
  await fs.mkdir(outputPath, { recursive: true });

  const prefixUrl = `https://${teamName}.slack.com/api`;
  const cookieAuthValue = encodeURIComponent(decodeURIComponent(cookieAuth));
  const timestamp = Math.round(Date.now() / 1000);
  const client = got.extend({
    prefixUrl,
    retry: { limit: 5, methods: ["POST"] },
    responseType: "json",
    timeout: { request: 30_000 },
    headers: { cookie: `d=${cookieAuthValue}; d-s=${timestamp}` },
    hooks: {
      afterResponse: [
        (res) => {
          if (!res.body.ok)
            throw new Error(`Response was not ok: ${res.body.error}`);
          return res;
        },
      ],
    },
  });
  let page = 1;
  let totalPages = Number.MAX_SAFE_INTEGER;
  let totalProcessed = 0;

  while (page <= totalPages) {
    const form = new FormData();
    form.append("token", token);
    form.append("page", page);
    form.append("count", countToDownloadPerPage);

    const res = await client.post("emoji.adminList", { body: form }).json();
    const emojiDownloads = res.emoji
      .filter((e) => !e.is_alias)
      .map((e) => downloadEmoji(e, outputPath));
    await Promise.all(emojiDownloads);

    totalProcessed += emojiDownloads.length;
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
  process.exitCode = 1;
}
