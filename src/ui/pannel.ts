export default class GenericPanel {
  private panel: HTMLElement;
  private content: HTMLElement;
  private overlay: HTMLElement;

  constructor(panelId: string, contentId: string, overlayId: string) {
    const panelEl = document.getElementById(panelId);
    const contentEl = document.getElementById(contentId);
    const overlayEl = document.getElementById(overlayId);

    if (!panelEl) throw new Error(`Elemento con id "${panelId}" non trovato nel DOM`);
    if (!contentEl) throw new Error(`Elemento con id "${contentId}" non trovato nel DOM`);
    if (!overlayEl) throw new Error(`Elemento con id "${overlayId}" non trovato nel DOM`);

    this.panel = panelEl;
    this.content = contentEl;
    this.overlay = overlayEl;
    this.panel.classList.add("hidden");
    this.overlay.classList.add("hidden");

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
