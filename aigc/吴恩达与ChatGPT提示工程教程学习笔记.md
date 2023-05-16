# 吴恩达与 ChatGPT 提示工程教程学习笔记

> 4 月 27 日, Ng 和 OpenAI 团队共同出品了 9 节 _ChatGPT Prompt Engineering for Developers_ 课程. 作为 ChatGPT 的花式调教用户, 和不专业的 "Prompt Engineer", 趁着五一放假学习一下, 若有谬误共同探讨.

## Introducing Large Language Models

大语言模型分为 Base LLM 和 Instruction Tuned LLM.

基础语言模型是指只在大规模文本语料中进行了预训练的模型, 未经过指令和下游任务微调, 以及人类反馈等任何对齐优化. 它主要用于**预测下一个单词**.

比如你的提示词是 "Once upon a time, there was a unicorn", 基础语言模型可能会给你返回 "that lived in a magical forest with all her unicorn friends".

再比如你的提示词是 "What is the capital of France?", 它可能会给你返回 "What is France's largest city? What is France's population? What is the currency of France?"

事实上, 我们仅仅想得到 "Paris", 但为什么会输出上面的结果呢? 因为基础语言模型的作用是预测并补全, 并非指令性的回答, 因此对于这个返回, 它可能学到的是**一段关于法国知识小测验的列表**.

而 Instruction(指令) 是指通过自然语言形式对任务进行描述, 它在基础语言模型的基础上进一步训练, 用输入和输入进一步微调, 这些输入和输出都是指令.

此外, 在微调时使用了从人类反馈中进行强化学习的方法(Reinforcement Learning from Human Feedback, RLHF), 这里的人类反馈其实就是人工标注数据来不断微调 LLM, 主要目的是让 LLM 学会理解人类的命令指令的含义, 使得在一般文本数据语料库上训练的语言模型能和复杂的人类价值观对齐.

![Steps to Instruction Tuned LLM](https://edge.yancey.app/beg/d8f7qywv-1682856212609.jpeg)

以 OenAI 的 GPT 为例, GPT-3 就是 Base LLM; GPT-3.5 就是 Instruction Tuned LLM; 而 ChatGPT 是在 GPT-3.5 基础上进行微调得到的, 用到了 RLHF 技术.

## Two key principals for how to write prompts effectively

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

![Avoid prompt injections](https://edge.yancey.app/beg/khplnqui-1682862064317.png)

#### Tactic 2: Ask for structured output

如下面的例子, 如果不提供输出结构, 它默认给出了一个 list 形式, 而如果你主动要求一个结构化的输出, 如 JSON, HTML 等等, 这样的好处是数据在你在代码中直接可用.

![Ask for structured output](https://edge.yancey.app/beg/b7qza93v-1682870423116.png)

#### Tactic 3: Check whether conditions are satisfied

如果任务中的假设不一定被满足, 我们可以告诉模型先检查这些假设, 如果不满足, 我们指出这一点, 并在完成任务的过程中停止.

下面这个例子中, 如果指定文本是按步骤来的, 那就转换成 Step 的形式, 否则简单的返回 **No steps provided.**

第一个例子来阐述泡茶的步骤, 显然能够被转换成 Step 的形式. 并且我们看到它识别出了文本中的 **If you like**, 因此在 Step 5 标明了 Optional, 太牛逼了.

![Ask for structured output phrase 1](https://edge.yancey.app/beg/4min1988-1682871722526.png)

第二段话仅仅是描写天气和风景的文本, 不是步骤的形式, 那么模型直接识别 falsy 的部分, 简单返回 **No steps provided.** 即可.

![Ask for structured output phrase 2](https://edge.yancey.app/beg/emlz3z7r-1682871728569.png)

#### Tactic 4: "Few-shot" prompting

这个策略的意思是: 在要求模型做你想让它做的实际任务之前, 给予模型一个明确的, 成功的例子, 让模型照着这个例子输出新的文本, 从而达到一致性.

下面这个例子, 我们想让模型输出 **Answer: XXXX** 这样一种格式, 并且语气要跟示例一中的 Answer 一致. 首先喂给模型一个例子, **Question: 如何促进拉新**, Answer 就是从网上抄的一段互联网黑话. 在输出中, 我们看到 ChatGPT 返回了我们想要的格式, 并且模仿了互联网黑化的语气解释了**如何保证留存**这一话题.

!["Few-shot" prompting](https://edge.yancey.app/beg/7e223817-1682873311723.png)

### Give the model time to "think"

第二个原则给予模型更多的思考时间. 如果一个模型急于得出不正确的结论而出现推理错误, 你应该尝试重新设计询问, 以便在模型提供最终答案之前请求一系列相关推理.

#### Tactic 1: Specify the steps required to complete a task

具体来讲, 如果你的一个 prompt 需要完成多件事情, 最好的做法是用分步的形式来描述.

下面的例子依次是: 总结这段话; 把这段话翻译成日语; 把段落中提到的人名翻译成日语; 生成包含 japanese_summary 和 num_names 的 JSON 数据.

最后还要求每个答案之间用空行隔开, 这样能保证一个漂亮的输出效果.

```bash
Perform the following actions:

1 - Summarize the following text delimited by triple quotes with 1 sentence.
2 - Translate the summary into Japanese.
3 - List each name in the Japanese summary.
4 - Output a json object that contains the following keys: japanese_summary, num_names.

Separate your answers with line breaks.

Text:

"""
In a charming village, siblings Jack and Jill set out on a quest to fetch water from a hilltop well. As they climbed, singing joyfully, misfortune struck—Jack tripped on a stone and tumbled down the hill, with Jill following suit. Though slightly battered, the pair returned home to comforting embraces. Despite the mishap, their adventurous spirits remained undimmed, and they continued exploring with delight.
"""
```

![Specify the steps required to complete a task](https://edge.yancey.app/beg/nfw9o1iw-1684155686954.png)

但是上面这个例子有个缺点, 我们看到第三个 `List each name in the Japanese summary.` 这里, 它把 name 也翻译成了日语. 因此为了更加准确, 可以给它一个可预测的更加精确的输出形式.

下面的优化例子

```bash
Your task is to perform the following actions:

1 - Summarize the following text delimited by <> with 1 sentence.
2 - Translate the summary into Japanese.
3 - List each name in the Japanese summary.
4 - Output a json object that contains the following keys: japanese_summary, num_names.

Use the following format:

Text: <text to summarize>

Summary: <summary>

Translation: <summary translation>

Names: <list of names in Japanese summary>

Output JSON: <json with summary and num_names>

Text:

<
In a charming village, siblings Jack and Jill set out on a quest to fetch water from a hilltop well. As they climbed, singing joyfully, misfortune struck—Jack tripped on a stone and tumbled down the hill, with Jill following suit. Though slightly battered, the pair returned home to comforting embraces. Despite the mishap, their adventurous spirits remained undimmed, and they continued exploring with delight.
>
```

![Specify the steps required to complete a task optimization](https://edge.yancey.app/beg/k2qvk738-1684208011165.png)

#### Tactic 2: Instruct the model to work out its own solution before rushing to a conclusion

这条策略的意思是: 不要让模型基于对某件事下结论, 而是在得出结论前, 先得出自己的结论.

下面这个例子是出了一道题目, 并让模型判断判断学生的答案是否正确. 下面的答案显然是错的, 因为是 `and an additional $10 / square foot`, 而学生的答案写成了 100. 但很遗憾的是, 模型给出的回复是 `The student's solution is correct.`.

```bash
Determine if the student's solution is correct or not.

Question:
I'm building a solar power installation and I need help working out the financials.

- Land costs $100 / square foot
- I can buy solar panels for $250 / square foot
- I negotiated a contract for maintenance that will cost me a flat $100k per year, and an additional $10 / square foot

What is the total cost for the first year of operations as a function of the number of square feet.

Student's Solution:

Let x be the size of the installation in square feet.

Costs:

1. Land cost: 100x
2. Solar panel cost: 250x
3. Maintenance cost: 100,000 + 100x

Total cost: 100x + 250x + 100,000 + 100x = 450x + 100,000
```

![Instruct the model to work out its own solution before rushing to a conclusion](https://edge.yancey.app/beg/5fg8jycg-1684210235607.png)

为什么模型认为是对的呢? 因为你给模型的要求是判断学生的答案是否正确, 因此模型更关心学生的解决方案而非问题, 即下面这段 Prompt:

```bash
Let x be the size of the installation in square feet.

Costs:

1. Land cost: 100x
2. Solar panel cost: 250x
3. Maintenance cost: 100,000 + 100x

Total cost: 100x + 250x + 100,000 + 100x = 450x + 100,000
```

这样一条一条读下来, 从逻辑上确实能从 1 2 3 得到 Total cost, 因此模型认为是正确的.

我们改一下这个例子, 开头要求在让模型先自己解决这个问题, 然后再去判断学生的答案是否正确, 并且强调了在模型未解决这个问题之前, 不允许判断学生的答案是否正确.

```bash
Your task is to determine if the student's solution is correct or not.

To solve the problem do the following:

- First, work out your own solution to the problem.
- Then compare your solution to the student's solution and evaluate if the student's solution is correct or not.

Don't decide if the student's solution is correct until you have done the problem yourself.

Use the following format:

Question:

"""
question here
"""

Student's solution:

"""
student's solution here
"""

Actual solution:

"""
steps to work out the solution and your solution here
"""

Is the student's solution the same as actual solution just calculated:

"""
yes or no
"""

Student grade:

"""
correct or incorrect
"""

Question:

"""
I'm building a solar power installation and I need help working out the financials.

- Land costs $100 / square foot
- I can buy solar panels for $250 / square foot
- I negotiated a contract for maintenance that will cost me a flat $100k per year, and an additional $10 / square foot

What is the total cost for the first year of operations as a function of the number of square feet.
"""

Student's solution:

"""
Let x be the size of the installation in square feet.

Costs:

1. Land cost: 100x
2. Solar panel cost: 250x
3. Maintenance cost: 100,000 + 100x

Total cost: 100x + 250x + 100,000 + 100x = 450x + 100,000
"""

Actual solution:
```

![Instruct the model to work out its own solution before rushing to a conclusion Optmization](https://edge.yancey.app/beg/tssyyev7-1684211154354.png)

## Model Limitations

尽管语言模型在训练过程中已经接触了大量的知识, 但在其训练过程中, 它并没有完美的记住它所看到的信息, 因此它对一些知识边界并不了解, 这意味着它可能回答一些晦涩难懂的问题, 并且可以编造一些听起来有道理但实际上并不真实的事情. 我们把这些由模型编造的想法称之为幻觉(Hallucination).

比如下面这个例子, 我捏造了 BMW 旗下有一款叫做库里南的跑车, 它仍能够一本正经的胡说八道, 因此尽量保证模型不一本正经的胡说八道之前, 先保证你的 Prompt 不一本正经的胡说八道.

![Model Limitations](https://edge.yancey.app/beg/yp0djq31-1684224838949.png)

## Iterative Prompt Develelopment

没有人能够保证第一次写的 Prompt 就可以得到的想要的结果, 一如没人能保证一次算法模型训练就能达到想要的效果. Prompts 的设计亦如此, 如果第一次没达到效果, 那就在此基础上迭代优化, 总会得到想要的效果.

让我们举一个例子来描述如何反复迭代一个 Prompt, 让它最终能为我们使用. 下面这个例子提供了了一个椅子的说明书, 我们想让模型依据技术规格为之写一个营销文案.

```bash
Your task is to help a marketing team create a description for a retail website of a product based on a technical fact sheet.

Write a product description based on the information provided in the technical specifications delimited by triple quotes.

Technical specifications:

"""
OVERVIEW
- Part of a beautiful family of mid-century inspired office furniture,
including filing cabinets, desks, bookcases, meeting tables, and more.
- Several options of shell color and base finishes.
- Available with plastic back and front upholstery (SWC-100)
or full upholstery (SWC-110) in 10 fabric and 6 leather options.
- Base finish options are: stainless steel, matte black,
gloss white, or chrome.
- Chair is available with or without armrests.
- Suitable for home or business settings.
- Qualified for contract use.

CONSTRUCTION
- 5-wheel plastic coated aluminum base.
- Pneumatic chair adjust for easy raise/lower action.

DIMENSIONS
- WIDTH 53 CM | 20.87”
- DEPTH 51 CM | 20.08”
- HEIGHT 80 CM | 31.50”
- SEAT HEIGHT 44 CM | 17.32”
- SEAT DEPTH 41 CM | 16.14”

OPTIONS
- Soft or hard-floor caster options.
- Two choices of seat foam densities:
 medium (1.8 lb/ft3) or high (2.8 lb/ft3)
- Armless or 8 position PU armrests

MATERIALS
SHELL BASE GLIDER
- Cast Aluminum with modified nylon PA6/PA66 coating.
- Shell thickness: 10 mm.
SEAT
- HD36 foam

COUNTRY OF ORIGIN
- Italy
"""
```

![image.png](https://edge.yancey.app/beg/2kx7pco0-1684227900995.png)

第一次迭代, 效果还不错, 按照技术规格书详细描述了这把椅子. 但问题是太长了. 我们尝试一次迭代, 在 Prompt 上加上一句 `Use at most 50 words.`, 再看一下效果, 发现还不错.

```bash
Your task is to help a marketing team create a description for a retail website of a product based on a technical fact sheet.

Write a product description based on the information provided in the technical specifications delimited by triple quotes.

Use at most 50 words.

...
```

![image.png](https://edge.yancey.app/beg/g3szrb7o-1684229240237.png)

但我们通过 `string.split(' ').length` 可以看出这段话足足有 67 个单词, 并没有满足我们设想的最多 50 个单词的要求. 这里需要知道的是, 大语言模型并不能很精确的按单词数量输出答案. 所以你可以换一些近似的修辞, 如 `Use at 3 sentences.` 或者 `Use at most 280 characters.` 多次尝试总会有一个接近你想要的效果.

让我们继续迭代, 假设我们的产品介绍语是面向家具零售商, 他们更关注技术参数以及材质.

```bash
Your task is to help a marketing team create a description for a retail website of a product based on a technical fact sheet.

Write a product description based on the information provided in the technical specifications delimited by triple quotes.

The description is intended for furniture retailers, so should be technical in nature and focus on the materials the product is constructed from.

Use at most 50 words.
```

![image.png](https://edge.yancey.app/beg/h17sggl5-1684230864905.png)

我们看到, 这段描述语更倾向于描述产品的规格, 因此效果是不错的.
