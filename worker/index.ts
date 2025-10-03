import {
  handleListArticles,
  handleCreateArticle,
  handleGetArticle,
  handleUpdateArticle,
  handleDeleteArticle,
} from './handler'

type Route = [
  (request: Request, env: Env, context: ExecutionContext) => Promise<Response>,
  string,
  'POST' | 'GET' | 'PUT' | 'DELETE'
]

async function handleHelloWorld(request: Request, env: Env, context: ExecutionContext): Promise<Response> {
  return new Response("Hello, world!", { status: 200 });
}

export default {
  async fetch(request, env, context) {
    const url = new URL(request.url);
    const method = request.method;

    const routes: Route[] = []
    // 文章 APIs
    routes.push([handleListArticles, '/api/articles', 'GET'])
    routes.push([handleCreateArticle, '/api/articles', 'POST'])
    routes.push([handleGetArticle, '/api/articles/', 'GET'])
    routes.push([handleUpdateArticle, '/api/articles/', 'PUT'])
    routes.push([handleDeleteArticle, '/api/articles/', 'DELETE'])

    // 兜底
    routes.push([handleHelloWorld, '/', 'GET']) 
    const route = routes.find((route) => route[2] === method && url.pathname.startsWith(route[1]));
    if (route) {
      return await route[0](request, env, context);
    }

    return new Response("Route Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
