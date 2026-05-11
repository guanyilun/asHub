import { bootSession } from "./sse.js";

class SessionView extends HTMLElement {
  connectedCallback() {
    bootSession();
  }
  disconnectedCallback() {
  }
}

customElements.define("session-view", SessionView);
