import { createArTxRecord, getArticle, getArTxRecord, listArticles, listArTxRecordsByMsgType, rankTopicsTopKArticles, searchTopics, updateArticle, updateArticleTopics, type Article } from "./db/table-ar_tx_record";


async function handleHelloWorld(request: Request, env: Env, context: ExecutionContext): Promise<Response> {
  return new Response("Hello, world!", { status: 200 });
}

export default {
  async fetch(request, env, context) {
    const url = new URL(request.url);
    const method = request.method;

    if (!url.pathname.startsWith('/api/rpc')) {
      return new Response("Route Not Correct", { status: 404 });
    }

    if (method === 'GET') {
      return handleHelloWorld(request, env, context);
    }

    if (method === 'POST') {
      const result = await handleRPC(request, env, context);
      return new Response(result, { status: 200 });
    }

    return new Response("Route Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;

const KEY_RPC_TYPES = [
  'REPORT_UPCHAIN_TX',
  'GET_UPCHAIN_TX',
  'GET_UPCHAIN_TXS',

  'UPDATE_ARTICLE',
  'GET_ARTICLE',
  'LIST_ARTICLES',

  'UPDATE_ARTICLE_TOPICS',
  'SEARCH_TOPICS',
  'RANK_TOPICS_TOPK',
] as const;

function validateRPCParams(...params: (any | null)[]): boolean {
  for (const param of params) {
    if (param === null || param === undefined) {
      return false;
    }
  }
  return true;
}

async function handleRPC(request: Request, env: Env, context: ExecutionContext): Promise<string> {
  const _body = await request.formData();
  // console.log(_body);
  const body = new Map<string, string | File>(_body.entries());
  const rpcType = body.get('rpc_type') as string;
  // console.log(body);
  if (!rpcType || !KEY_RPC_TYPES.includes(rpcType as (typeof KEY_RPC_TYPES)[number])) {
    throw new Error(`Invalid RPC Type: ${rpcType}`);
  }

  switch (rpcType) {
    case 'REPORT_UPCHAIN_TX': {
      const txId = body.get('tx_id') as string;
      const uid = body.get('uid') as string;
      const content = body.get('content') as File;
      const contentType = body.get('content_type') as string;
      const headers = body.get('headers') as string;
      const msgType = body.get('msg_type') as string;
      if (!validateRPCParams(txId, uid, content, contentType, headers, msgType)) {
        throw new Error("Invalid RPC Params REPORT_UPCHAIN_TX");
      }
      const res = await createArTxRecord(env, txId, uid, contentType, headers, content, msgType);
      return JSON.stringify(res);
    }
    case 'GET_UPCHAIN_TX': {
      const txId = body.get('tx_id') as string;
      if (!validateRPCParams(txId)) {
        throw new Error("Invalid RPC Params GET_UPCHAIN_TX");
      }
      const res = await getArTxRecord(env, txId);
      return JSON.stringify(res)
    }
    case 'GET_UPCHAIN_TXS': {
      const msg_type = body.get('msg_type') as string;
      if (!validateRPCParams(msg_type)) {
        throw new Error("Invalid RPC Params GET_UPCHAIN_TXS");
      }
      const res = await listArTxRecordsByMsgType(env, msg_type);
      return JSON.stringify(res);
    }
    case 'UPDATE_ARTICLE': {
      const article = body.get('article');
      if (!validateRPCParams(article)) {
        throw new Error("Invalid RPC Params UPDATE_ARTICLE");
      }
      const articleData = JSON.parse(article as string) as Article;
      const aid = await updateArticle(env, articleData);
      return JSON.stringify({ aid });
    }
    case 'GET_ARTICLE': {
      const aid = body.get('aid') as string;
      if (!validateRPCParams(aid)) {
        throw new Error("Invalid RPC Params GET_ARTICLE");
      }
      const res = await getArticle(env, aid);
      return JSON.stringify(res);
    }
    case 'LIST_ARTICLES': {
      const res = await listArticles(env);
      return JSON.stringify(res);
    }
    case 'UPDATE_ARTICLE_TOPICS': {
      const _topics = body.get('topics') as string;
      const aid = body.get('aid') as string;
      if (!validateRPCParams(_topics, aid)) {
        throw new Error("Invalid RPC Params UPDATE_ARTICLE_TOPICS");
      }
      const topics = JSON.parse(_topics) as string[];
      const res = await updateArticleTopics(env, topics, aid);
      return JSON.stringify(res);
    }
    case 'SEARCH_TOPICS': {
      const topic = body.get('topic') as string;
      if (!validateRPCParams(topic)) {
        throw new Error("Invalid RPC Params SEARCH_TOPICS");
      }
      const res = await searchTopics(env, topic);
      return JSON.stringify(res);
    }
    case 'RANK_TOPICS_TOPK': {
      const topic = body.get('topic') as string;
      const _topK = body.get('top_k') as string;
      if (!validateRPCParams(topic, _topK)) {
        throw new Error("Invalid RPC Params RANK_TOPICS_TOPK");
      }
      const topK = parseInt(_topK);
      const res = await rankTopicsTopKArticles(env, topic, topK);
      return JSON.stringify(res);
    }
    default: {
      console.error(`Invalid RPC Type: ${rpcType}`);
      throw new Error(`Invalid RPC Type: ${rpcType}`);
    }
  }
}