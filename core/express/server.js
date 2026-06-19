/* eslint-disable global-require */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-empty */
const expressEnums = require('./enums');

function Server(serverConfig = {}) {
  const express = require('express');
  const { appLogger } = require('@app-core/logger');
  const { ERROR_STATUS_CODE_MAPPING } = require('@app-core/errors');
  const cors = require('cors');

  const app = express();
  const errorCodeMappings = ERROR_STATUS_CODE_MAPPING;

  const {
    port = 8811,
    JSONLimit = '50mb',
    enableCors = false,
  } = serverConfig;

  if (enableCors) {
    app.use(cors());
  }

  app.use(express.json({ limit: JSONLimit }), (err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      res.status(400).json({
        status: 'error',
        message: 'Error encountered in parsing request payload. Please check payload and try again',
        code: 'ERR',
      });
    } else {
      next();
    }
  });

  const handlerHelpers = {};
  handlerHelpers.http_statuses = expressEnums.HTTPStatusCode;

  function addHandler(handlerConfiguration) {
    const { method, path } = handlerConfiguration;
    app[method](path, async (expressRequest, expressResponse) => {
      const requestComponents = {
        body: {},
        query: {},
        params: {},
        headers: {},
        meta: {},
        props: handlerConfiguration.props || {},
        properties: {},
      };

      const responseComponents = {
        statusCode: 0,
        body: { message: '', status: '' },
      };

      try {
        const middlewares = handlerConfiguration.middlewares || [];
        const { body, query, params, headers } = expressRequest;

        const properties = {};
        properties.IP = expressRequest.ip;
        properties.baseURL = expressRequest.baseUrl;
        properties.method = expressRequest.method;
        properties.requestURL = expressRequest.originalUrl;
        properties.hostname = expressRequest.hostname;

        requestComponents.body = body;
        requestComponents.query = query;
        requestComponents.params = params;
        requestComponents.headers = headers;
        requestComponents.properties = properties;

        let middlewareExecutionContext = {};
        for (const middleware of middlewares) {
          if (middlewareExecutionContext.shouldSkipOtherMiddlewares) {
            middlewareExecutionContext.shouldSkipOtherMiddlewares = false;
            break;
          }
          if (middlewareExecutionContext.shouldSkipNextMiddleware) {
            middlewareExecutionContext.shouldSkipNextMiddleware = false;
            continue;
          }

          middlewareExecutionContext = {};
          const middlewareResult = await middleware.handler(requestComponents, handlerHelpers);

          if (middlewareResult.skipOtherMiddlewares) {
            middlewareExecutionContext.shouldSkipOtherMiddlewares = true;
          }
          if (middlewareResult.skipNextMiddleware) {
            middlewareExecutionContext.shouldSkipNextMiddleware = true;
          }

          const augments = middlewareResult.augments || {};
          if (augments.meta) requestComponents.meta = { ...requestComponents.meta, ...augments.meta };
          if (augments.body) requestComponents.body = { ...requestComponents.body, ...augments.body };
          if (augments.query) requestComponents.query = { ...requestComponents.query, ...augments.query };
          if (augments.params) requestComponents.params = { ...requestComponents.params, ...augments.params };
          if (augments.headers) requestComponents.headers = { ...requestComponents.headers, ...augments.headers };

          if (middlewareResult.endHandlerChain) {
            middlewareExecutionContext.shouldEndRequest = true;
            middlewareExecutionContext.result = middlewareResult;
            break;
          }
        }

        let result;
        if (!middlewareExecutionContext.shouldEndRequest) {
          result = await handlerConfiguration.handler(requestComponents, handlerHelpers);
        } else {
          result = middlewareExecutionContext.result;
        }

        responseComponents.statusCode = result.status || 200;
        responseComponents.body.status = 'success';
        responseComponents.body.message = result.message;
        responseComponents.body.data = result.data || {};

        expressResponse.status(responseComponents.statusCode).json(responseComponents.body);
      } catch (error) {
        const statusCode = !error.isApplicationError
          ? 500
          : errorCodeMappings[error.errorCode] || 400;

        appLogger.error({ errorCode: error.errorCode, errorMessage: error.message }, `error: ${statusCode} ${method} ${path}`);

        responseComponents.statusCode = statusCode;
        responseComponents.body.status = 'error';
        responseComponents.body.message = error.isApplicationError
          ? error.message
          : 'Some error occurred.';

        if (error.errorCode && error.isApplicationError) {
          responseComponents.body.code = error.errorCode;
        }

        if (error.details) {
          responseComponents.body.errors = error.details;
        }

        expressResponse.status(responseComponents.statusCode).json(responseComponents.body);
      } finally {
        if (typeof handlerConfiguration.onResponseEnd === 'function') {
          try {
            handlerConfiguration.onResponseEnd(requestComponents, responseComponents);
          } catch (e) {
            appLogger.error([e.message, e.stack], 'onResponseEnd error');
          }
        }
      }
    });
  }

  function executeRequest(request, response, nextFunction) {
    return app(request, response, nextFunction);
  }

  function startServer() {
    app.use((_, res) => {
      res.status(404).json({ status: 'error', message: 'Resource not found.' });
    });
    app.use((err, _, res) => {
      appLogger.errorX(err, 'global-500-error');
      res.status(500).json({ status: 'error', message: 'Some error occurred.' });
    });
    app.listen(port, () => {
      appLogger.info(`Listening at port ${port}`);
    });
  }

  return { startServer, addHandler, executeRequest };
}

module.exports = Server;
