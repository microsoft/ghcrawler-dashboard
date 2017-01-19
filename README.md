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

The project team is more than happy to take contributions and suggestions.

To start working, run npm install in the repository folder to install the required dependencies.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
