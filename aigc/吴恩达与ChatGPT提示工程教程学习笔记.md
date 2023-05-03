# 吴恩达与 ChatGPT 提示工程教程学习笔记

> 4 月 27 日, Ng 和 OpenAI 团队共同出品了 9 节 _ChatGPT Prompt Engineering for Developers_ 课程. 作为 ChatGPT 的花式调教用户, 和不专业的 "Prompt Engineer", 趁着五一放假学习一下, 若有谬误共同探讨.

## 大型语言模型(LLMs, Large Language Models)

大语言模型分为 Base LLM 和 Instruction Tuned LLM.

基础语言模型是指只在大规模文本语料中进行了预训练的模型, 未经过指令和下游任务微调, 以及人类反馈等任何对齐优化. 它主要用于**预测下一个单词**.

比如你的提示词是 "Once upon a time, there was a unicorn", 基础语言模型可能会给你返回 "that lived in a magical forest with all her unicorn friends".

再比如你的提示词是 "What is the capital of France?", 它可能会给你返回 "What is France's largest city? What is France's population? What is the currency of France?"

事实上, 我们仅仅想得到 "Paris", 但为什么会输出上面的结果呢? 因为基础语言模型的作用是预测并补全, 并非指令性的回答, 因此对于这个返回, 它可能学到的是**一段关于法国知识小测验的列表**.

而 Instruction(指令) 是指通过自然语言形式对任务进行描述, 它在基础语言模型的基础上进一步训练, 用输入和输入进一步微调, 这些输入和输出都是指令.

此外, 在微调时使用了从人类反馈中进行强化学习的方法(Reinforcement Learning from Human Feedback, RLHF), 这里的人类反馈其实就是人工标注数据来不断微调 LLM, 主要目的是让 LLM 学会理解人类的命令指令的含义, 使得在一般文本数据语料库上训练的语言模型能和复杂的人类价值观对齐.

![FKH5asmVQAAbBub.jpeg](https://edge.yancey.app/beg/d8f7qywv-1682856212609.jpeg)

以 OenAI 的 GPT 为例, GPT-3 就是 Base LLM; GPT-3.5 就是 Instruction Tuned LLM; 而 ChatGPT 是在 GPT-3.5 基础上进行微调得到的, 用到了 RLHF 技术.

## 写好 Prompt 的两个关键原则

### Write clear and specific instructions

首先要明确 clear 不意味着 short, 因为在很多情况下较长的提示能够提供更清晰地描述和上下文, 这也能够带来更加详细和确切的输出.

#### Tactic 1: Uses delimiters

分隔符来明确指出输入的不同部分

- Triple quotes: `"""`
- Triple backtick: ` ``` `
- Triple dashes: `---`
- Angle brackets: `< >`
- XML tags: `<tag> </tag>`

举个例子, 下面是给星舰的介绍生成一句话摘要, 就可以将介绍文案包裹起来, 这里使用了 Triple backtick, 你也可以使用上述其他的分隔符. 总之这样就是**告诉模型清楚的知道这是一个单独的部分**.

![Starship](https://edge.yancey.app/beg/pxpsr024-1682861286776.png)

再举个例子, 也是我在开发 [rs_openai](https://crates.io/crates/rs_openai) 是常干的事情, 就是让 ChatGPT 帮忙生成 Rust 结构体.

```bash
Generate the json string delimited by triple quotes into rust structs with serde and default.

"""
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "\n\nHello there, how may I assist you today?",
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 9,
    "completion_tokens": 12,
    "total_tokens": 21
  }
}
"""
```

虽然当时也没用使用分隔符, ChatGPT 也足以给出优秀的答案. 不过既然看了这门课, 都听官方的. 🫡

```rust
#[derive(Debug, Deserialize, Default)]
struct ChatCompletion {
   id: String,
   object: String,
   created: i64,
   choices: Vec<Choice>,
   usage: Usage,
}

#[derive(Debug, Deserialize, Default)]
struct Choice {
    index: i32,
    message: Message,
    finish_reason: String,
}

#[derive(Debug, Deserialize, Default)]
struct Message {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize, Default)]
struct Usage {
    prompt_tokens: i32,
    completion_tokens: i32,
    total_tokens: i32,
}
```

此外, 视频介绍了要避免提示词注入, 它举了如下例子. 即开头提示模型来总结 ` ``` ` 之间的文字, 但黄色部分又要求模型不去做总结, 转而写一首关于 cuddy panda bears 的诗. 这种语意矛盾的 prompt 即为 prompt injections, 这是我们需要避免的.

![Screenshot 2023-04-30 at 21.40.42.png](https://edge.yancey.app/beg/khplnqui-1682862064317.png)

#### Tactic 2: Ask for structured output

如下面的例子, 如果不提供输出结构, 它默认给出了一个 list 形式, 而如果你主动要求一个结构化的输出, 如 JSON, HTML 等等, 这样的好处是数据在你在代码中直接可用.

![Screenshot 2023-05-01 at 00.00.04.png](https://edge.yancey.app/beg/b7qza93v-1682870423116.png)

#### Tactic 3: Check whether conditions are satisfied

如果任务中的假设不一定被满足, 我们可以告诉模型先检查这些假设, 如果不满足, 我们指出这一点, 并在完成任务的过程中停止.

下面这个例子中, 如果指定文本是按步骤来的, 那就转换成 Step 的形式, 否则简单的返回 **No steps provided.**

第一个例子来阐述泡茶的步骤, 显然能够被转换成 Step 的形式. 并且我们看到它识别出了文本中的 **If you like**, 因此在 Step 5 标明了 Optional, 太牛逼了.

![Screenshot 2023-05-01 at 00.21.36.png](https://edge.yancey.app/beg/4min1988-1682871722526.png)

第二段话仅仅是描写天气和风景的文本, 不是步骤的形式, 那么模型直接识别 falsy 的部分, 简单返回 **No steps provided.** 即可.

![Screenshot 2023-05-01 at 00.21.49.png](https://edge.yancey.app/beg/emlz3z7r-1682871728569.png)

#### Tactic 4: "Few-shot" prompting

这个策略的意思是: 在要求模型做你想让它做的实际任务之前, 给予模型一个明确的, 成功的例子, 让模型照着这个例子输出新的文本, 从而达到一致性.

下面这个例子, 我们想让模型输出 **Answer: XXXX** 这样一种格式, 并且语气要跟示例一中的 Answer 一致. 首先喂给模型一个例子, **Question: 如何促进拉新**, Answer 就是从网上抄的一段互联网黑话. 在输出中, 我们看到 ChatGPT 返回了我们想要的格式, 并且模仿了互联网黑化的语气解释了**如何保证留存**这一话题.

![Screenshot 2023-05-01 at 00.48.16.png](https://edge.yancey.app/beg/7e223817-1682873311723.png)

### Give the model time to "think"

第二个原则给予模型更多的思考时间. 如果一个模型急于得出不正确的结论而出现推理错误, 你应该尝试重新设计询问, 以便在模型提供最终答案之前请求一系列相关推理

#### Tactic 1: Specify the steps required to complete a task4k