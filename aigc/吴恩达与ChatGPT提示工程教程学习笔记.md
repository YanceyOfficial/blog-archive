# 吴恩达与 ChatGPT 提示工程教程学习笔记

> 4 月 27 日, Ng 和 OpenAI 团队共同出品了 9 节 _ChatGPT Prompt Engineering for Developers_ 课程. 作为 ChatGPT 的花式调教用户, 和不专业的 "Prompt Engineer", 趁着五一放假学习一下, 若有谬误共同探讨.

## 大型语言模型(LLMs, Large Language Models)

大语言模型分为 Base LLM 和 Instruction Tuned LLM.

基础语言模型是指只在大规模文本语料中进行了预训练的模型, 未经过指令和下游任务微调, 以及人类反馈等任何对齐优化. 它主要用于**预测下一个单词**.

比如你的提示词是 "Once upon a time, there was a unicorn", 基础语言模型可能会给你返回 "that lived in a magical forest with all her unicorn frinds".

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

再举个例子, 也是我在开发 rs_openai 是常干的事情, 就是让 ChatGPT 帮忙生成 Rust 结构体.

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

### Give the model time to think
