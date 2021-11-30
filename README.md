# slack-emoji-export

Export all custom emoji together with aliases in a Slack team.

## Usage

```bash
npm install

./index.mjs <slackTeamName> <slackToken> <cookieAuth>
```

`slackTeamName` is the name of the workspace you want to export. It's the first part of the URL when accessing Slack so `example` in this case: example.slack.com.

`slackToken` can be yanked from the requests made when navigating to the emoji customisation page at https://slackTeamName.slack.com/customize/emoji. Find the XHR request to `emoji.adminList` and copy it from the `token` field in posted Form Data.

`cookieAuth` can be found from the same request as the value of the `d` cookie.
