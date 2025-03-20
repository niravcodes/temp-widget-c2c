import { SignalWire, SignalWireClient } from "@signalwire/js";
import { CallDetails } from ".";
import { Chat, ChatState } from "./Chat";
export class Call {
  private client: SignalWireClient | null = null;
  private callDetails: CallDetails | null = null;
  chat: Chat = new Chat();

  constructor(callDetails: CallDetails) {
    this.callDetails = callDetails;
    this.setupClient();
  }

  async setupClient() {
    if (!import.meta.env.VITE_PUBLIC_TOKEN) {
      throw new Error("PUBLIC_TOKEN env variable is not set");
    }
    this.client = await SignalWire({
      token: import.meta.env.VITE_PUBLIC_TOKEN,
    });

    // @ts-ignore
    this.client.on("ai.partial_result", (params) => {
      // AI partial result (typing indicator)
      console.log("ai.partial_result", params.text);
      this.chat.handleEvent("ai.partial_result", params.text);
    });

    // @ts-ignore
    this.client.on("ai.speech_detect", (params) => {
      // AI speech detection (user speaking)
      const cleanText = params.text.replace(/\{confidence=[\d.]+\}/, "");
      console.log("ai.speech_detect", cleanText);
      this.chat.handleEvent("ai.speech_detect", cleanText);
    });

    // @ts-ignore
    this.client.on("ai.completion", (params) => {
      // AI completion (final response)
      console.log("ai.completion", params.text);
      this.chat.handleEvent("ai.completion", params.text);
    });

    // @ts-ignore
    this.client.on("ai.response_utterance", (params) => {
      // AI response utterance (spoken response)
      console.log("ai.response_utterance", params.utterance);
      this.chat.handleEvent("ai.response_utterance", params.utterance);
    });
  }

  async dial(
    container: HTMLElement,
    onChatChange: (chatState: ChatState) => void
  ) {
    if (!this.client) {
      throw new Error("Client is not set");
    }
    if (!this.callDetails) {
      throw new Error("Call details are not set");
    }

    const currentCall = await this.client.dial({
      to: this.callDetails.destination,
      rootElement: container,
      audio: this.callDetails.supportsAudio,
      video: this.callDetails.supportsVideo,
      negotiateVideo: this.callDetails.supportsVideo,
    });
    const dialedCall = currentCall.start();

    this.chat.onUpdate = () => {
      onChatChange(this.chat.state);
    };

    // currentCall.on("", onChatChange);

    console.log("currentCall", currentCall);

    return currentCall;
  }
}
