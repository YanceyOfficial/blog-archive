# 浅谈 GraphQL

GraphQL 是一种用于 API 的查询语言, 并且提供已有数据查询的运行时. 目前 Facebook, Twitter, Airbnb 各大厂已经在生产环境使用 GraphQL 了, GitHub API v4 也已全面使用 GraphQL.

## 精准、可预测地返回数据

传统的 RESTful 接口, 后端传递多少字段, 前端就得接收多少字段. 因此, 有时候前端只需要几个字段, 但后端返回一大串(尤其是历史悠久的接口), 这不但对前端筛选接口字段增加了难度, 还可能会造成潜在的性能问题. 而 GraphQL 使得客户端能够准确地获得它需要的数据，而且没有任何冗余, 并且 GraphQL 筛选这些字段的过程不依赖于服务器, 而是它自己运行时.

```ts
export const POSTS = gql`
  query Posts($input: PaginationInput!) {
    posts(input: $input) {
      total
      page
      pageSize
      items {
        _id
        title
        summary
      }
    }
  }
```

```ts
@ObjectType()
export class SMSModel {
  @Field()
  @IsMobilePhone('zh-CN')
  @IsNotEmpty()
  public readonly phoneNumber: string

  @Field()
  @Length(6)
  @IsNumberString()
  @IsNotEmpty()
  public readonly smsCode: string
}
```

## 只请求一个接口

下面这个例子是一个经典的 RESTful 风格接口, 可以看到一套增删改查需要请求不同的 url, 这就导致了需要进行多个 TCP 连接. 虽然 HTTP2 提供了多路复用(同域名下所有通信都在单个连接上完成, 同个域名只需要占用一个 TCP 连接, 使用一个连接并行发送多个请求和响应)的特性. 但在网络仍然较慢的移动环境下, 我们仍希望尽可能的减少 HTTP 请求, GraphQL 的应用也能表现得足够迅速.

```ts
GET /posts
GET /post/:id
POST /post
PUT /post/:id
DELETE /post/:id
```

```ts
{
  operationName: "Posts",
  query: "...",
  variables: {
    input: {
      page: 1,
      pageSize: 10,
    },
  },
}
```
