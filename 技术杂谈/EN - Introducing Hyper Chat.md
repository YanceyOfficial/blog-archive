# Introducing Hyper Chat

> Recently, taking advantage of the trend of AIGC, we have created a chatbot based on OpenAI and Azure OpenAI Service using Tauri. The official version has been released and is available for download and use at <https://hyperchat.yancey.app/>. The code is available at <https://github.com/orgs/HyperChatBot>, and we welcome collaboration and optimization.

## Functions

Hyper Chat is a cross-platform chatbot based on Tauri. Although Tauri does not require the installation of heavy chromium, it lacks many features, such as `window.navigator.onLine` and `onCompositionStart`, compared to Electron. Therefore, some effects are not satisfactory in implementation.

The original intention of Hyper Chat is to never collect user information, such as OpenAI Secret Key and chat records. Therefore, we use indexedDB to store data. In the settings, we support importing and exporting data. Of course, if you are interested in providing a server, the frontend code is also easy to modify. You only need to replace the function in `src/hooks/useDB.ts` with your API interface.

![import-export-db](https://edge.yancey.app/beg/7qdfxtme-1691048273432.png)

On the frontend, we mainly use the combination of React + Vite + TailwindCSS + Recoil. This is also my first time using TailwindCSS.

In addition, we support two interfaces, OpenAI and Azure OpenAI Service, and will consider adding Claude 2 and Google Bard in the future. We also support light, dark, and system theme visual effects. To enhance the fun, in the chat box, we support modifying the assistant's avatar.

![settings](https://edge.yancey.app/beg/m2b4c1uo-1691048543013.png)

### Customizable ChatBox

In the chat box area, for each model API, we have configuration parameters consistent with the official ones for users to choose from.

![configuration](https://edge.yancey.app/beg/h2x64eyd-1691049298908.png)

In addition, there are some scattered small functions, such as supporting modifying the avatar and title of the session, deleting the session, and adding the session.

![other-configuration](https://edge.yancey.app/beg/g54fg3s4-1691049397740.png)

### Chat Completion

![chat-completions](https://edge.yancey.app/beg/frflci8f-1690808815033.png)

The core function of Hyper Chat is to support Chat Completion, and this module is the most elaborate in the entire app. Like the ChatGPT web effect, we support stream mode by default. In addition, we use a greedy strategy to bring as much context as possible in each conversation:

```ts
// Get the number of tokens for the user prompt
const userMessageTokensCount = getTokensCount(prompt, model);

// The total number of tokens equals the number of tokens in the user prompt plus the number of tokens in the system message plus the maximum number of tokens the assistant is expected to return this time
let tokensCount = userMessageTokensCount + systemMessageTokensCount + maxTokens;

// Get the maximum number of tokens supported by the current model, such as GPT-3.5-turbo, which supports up to 4097 tokens
const tokensLimit = models.find((m) => m.name === model)?.tokensLimit || 0;

// If the number of tokens in the user input prompt exceeds the threshold, an error message is displayed
if (tokensCount > tokensLimit) {
  toast.error(
    `This model's maximum context length is ${tokensLimit} tokens. However, you requested ${tokensCount} tokens (${
      tokensCount - maxTokens
    } in the messages, ${maxTokens} in the completion). Please reduce the length of the prompt.`
  );
  return;
}

// Traverse past messages in chronological order, from newest to oldest, and provide as much context as possible to the model for processing.
const context: CreateChatCompletionRequest["messages"] = [];
currConversation.messages
  .slice()
  .reverse()
  .forEach(({ tokensCount: historyTokensCount, content, role }) => {
    tokensCount += historyTokensCount;
    if (tokensCount > tokensLimit) return;
    context.unshift({
      role,
      content,
    });
  });
```

### Text Completion

![text-completion](https://edge.yancey.app/beg/9syfyonp-1690808800955.png)

We also support Text Completion, but according to the latest official documentation from OpenAI, this API is considered legacy and may be deprecated in the future. So cherish it while you can.

### Audio Transparent and Translation

Although OpenAI has open-sourced Whisper-1, we have integrated its API to support audio transcription and translation. Simply select the audio file in the bottom right corner and hit enter to submit. You can also input a prompt, but this is optional for audio.

![audio-transparent-and-translation](https://edge.yancey.app/beg/ajh4qoaa-1690808795519.png)

### Image Generation

We support image generation based on DALL-E's API. It is recommended to choose smaller image sizes in the configuration for faster generation. Also, generated images have an expiration time of about one day, so be sure to download them locally in a timely manner.

![image-generation](https://edge.yancey.app/beg/uo6x2952-1690808769662.png)

## 最后

We welcome everyone to try and use our platform. If you have any suggestions, please feel free to discuss them on our [Official Discussion](https://github.com/orgs/HyperChatBot/discussions/71).
