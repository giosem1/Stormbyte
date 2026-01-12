export default class GenericPanel {
  private panel: HTMLElement;
  private content: HTMLElement;
  private overlay: HTMLElement;

  constructor(panelId: string, contentId: string, overlayId: string) {
    this.panel = document.getElementById(panelId)!;
    this.content = document.getElementById(contentId)!;
    this.overlay = document.getElementById(overlayId)!;

    this.overlay.addEventListener("click", () => this.hide());
  }

  show(html: string): void {
    this.content.innerHTML = html;
    this.panel.classList.remove("hidden");
    this.overlay.classList.remove("hidden");
  }

  hide(): void {
    this.panel.classList.add("hidden");
    this.overlay.classList.add("hidden");
    this.content.innerHTML = "";
  }
}
