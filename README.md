# Crawler Dashboard
Crawler Dashboard to control [ghcrawler](https://github.com/Microsoft/ghcrawler) application.
- Displays queued active messages.
- Displays message rates.
- Displays and allows to change configuration.
- Allows to queue request.
- Allows to recrete queues.
- Allows to get and delete requests from a queue.

# Usage
## Configuration

### Environment Variables
The bare minimum configuration is:
```
{
  "DEBUG_ALLOW_HTTP" : true,
  "CRAWLER_REDIS_URL": "",
  "CRAWLER_REDIS_ACCESS_KEY": ""
}
```
For more options see env/env-template.json file.

The variables may be set either individually as environment variables or in env.json file at the same level as the project (ghcrawler-dashboard/../env.json).

### Install Node packages

```
$ npm install
```

### Test

```
$ npm test
```

### Run
`DEBUG=appinsights npm start` or

`DEBUG=* npm start`

_Note:_ Local environment can be accessed at [http://localhost:4000](http://localhost:4000).

# Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us the rights to use your contribution. For details, visit https://cla.microsoft.com.  

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions provided by the bot. You will only need to do this once across all repos using our CLA.  

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
