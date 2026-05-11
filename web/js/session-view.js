import { bootSession } from "./sse.js";

class SessionView extends HTMLElement {
  connectedCallback() {
    this.controller = new AbortController();
    bootSession(this.controller.signal);
  }
  disconnectedCallback() {
    this.controller?.abort();
  }
}

customElements.define("session-view", SessionView);
