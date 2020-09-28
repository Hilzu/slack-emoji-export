# slack-emoji-export
Export all custom emoji in a Slack team.

## Usage

```bash
npm install

./index.mjs <slackTeamName> <slackToken>
```

`slackTeamName` is the name of the workspace you want to export. It's the first part of the URL when accessing Slack so `example` in this case: example.slack.com.

`slackToken` can be yanked from the requests made when navigating to the emoji customisation page. It's part of the API request bodies.
