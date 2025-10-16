import articleApi, { type Article } from "./article";
import userApi, { type User } from "./user";
import arTxRecordApi, { type ArTxRecord } from "./ar_tx_record";

const api = {
  article: articleApi,
  user: userApi,
  arTxRecord: arTxRecordApi
}

export default api;

export type { Article as ArticleDAO, User as UserDAO, ArTxRecord as ArTxRecordDAO };