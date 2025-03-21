import modal from "./ui/modal.html.ts";
import { Call } from "./Call";

import createControls from "./ui/controls.ui.ts";
import html from "./lib/html";
import { ChatEntry } from "./Chat.ts";
import createChatUI from "./ui/chat.ui.ts";

export interface CallDetails {
  destination: string;
  supportsAudio: boolean;
  supportsVideo: boolean;
}

class C2CWidget extends HTMLElement {
  callOngoing: boolean = false;
  shadow = this.attachShadow({ mode: "open" });
  callDetails: CallDetails | null = null;
  call: Call | null = null;
  containerElement: HTMLElement | null = null;

  constructor() {
    super();
    this.setupDOM();
  }

  connectedCallback() {
    const buttonId = this.getAttribute("buttonId");
    if (buttonId) {
      const button = document.getElementById(buttonId);
      if (button) {
        button.addEventListener("click", () => this.setupCall());
      } else {
        console.error(`Button with ID "${buttonId}" not found.`);
      }
    }

    try {
      const callDetails = this.getAttribute("callDetails");
      if (callDetails === null) {
        throw new Error("callDetails attribute is required");
      }
      this.callDetails = JSON.parse(callDetails) as CallDetails;
    } catch (e) {
      console.error("Invalid JSON in callDetails attribute");
      this.callDetails = null;
    }

    if (this.callDetails) {
      this.call = new Call(this.callDetails);
    }
  }

  async setupCall() {
    if (this.callOngoing) {
      console.warn("Call is already ongoing; nop");
      return;
    } else if (this.callDetails === null) {
      console.warn("No call details provided");
      return;
    }

    this.callOngoing = true;

    const {
      modalContainer,
      videoArea,
      localVideoArea,
      controlsPanel,
      chatPanel,
    } = modal();

    this.containerElement?.appendChild(modalContainer);

    // note: we are awaiting this because this fn waits for
    // permissions and device list.
    const control = await createControls(
      function hangup() {
        callInstance?.hangup();
      },
      function onVideoDeviceSelect(deviceId: string) {
        callInstance?.updateCamera({ deviceId });
      },
      function onAudioInputSelect(deviceId: string) {
        callInstance?.updateMicrophone({ deviceId });
      },
      function onAudioOutputSelect(deviceId: string) {
        callInstance?.updateSpeaker({ deviceId });
      }
    );
    const callInstance = await this.call?.dial(videoArea, onChatChange);

    callInstance?.on("call.joined", () => {
      console.log("call.joined");
      if (callInstance?.localStream) {
        const { localVideo } = html`<video
          autoplay
          muted
          style="width: 100%; height: 100%;"
          name="localVideo"
        ></video>`();
        (localVideo as HTMLVideoElement).srcObject = callInstance.localStream;
        localVideoArea.appendChild(localVideo);
      }
    });

    function onChatChange(chatHistory: ChatEntry[]) {
      const chatPanelScrolledToBottom =
        chatPanel.scrollHeight - chatPanel.clientHeight <=
        chatPanel.scrollTop + 1;
      const previousScrollTop = chatPanel.scrollTop;

      const { chatContainer } = createChatUI(chatHistory);
      chatPanel.innerHTML = "";
      chatPanel.appendChild(chatContainer);

      if (chatPanelScrolledToBottom) {
        chatPanel.scrollTop = chatPanel.scrollHeight;
      } else {
        chatPanel.scrollTop = previousScrollTop;
      }
    }

    controlsPanel.appendChild(control);
  }

  setupDOM() {
    const container = document.createElement("div");
    this.shadow.appendChild(container);
    this.containerElement = container;
  }
}

customElements.define("c2c-widget", C2CWidget);
