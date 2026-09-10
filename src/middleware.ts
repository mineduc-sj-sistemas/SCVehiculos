import { defineMiddleware } from 'astro:middleware'

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next()
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('text/html') && !contentType.includes('charset')) {
    response.headers.set('content-type', `${contentType}; charset=utf-8`)
  }
  return response
})
