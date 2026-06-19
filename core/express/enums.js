const HTTPStatusCode = {
  HTTP_200_OK: 200,
  HTTP_201_CREATED: 201,
  HTTP_204_NO_CONTENT: 204,
  HTTP_400_BAD_REQUEST: 400,
  HTTP_401_UNAUTHORIZED: 401,
  HTTP_403_FORBIDDEN: 403,
  HTTP_404_NOT_FOUND: 404,
  HTTP_500_SERVER_ERROR: 500,
};

const ExpressHandlerMethod = {
  METHOD_ALL: 'all',
  METHOD_POST: 'post',
  METHOD_GET: 'get',
  METHOD_PATCH: 'patch',
  METHOD_PUT: 'put',
  METHOD_DELETE: 'delete',
  METHOD_USE: 'use',
};

module.exports = { HTTPStatusCode, ExpressHandlerMethod };
