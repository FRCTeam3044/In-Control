import { Remarkable } from "remarkable";
import { TabState } from "../../packages/utils/HubState";
import TabType from "../../packages/utils/TabType";
import TabController from "../TabController";

export default class DocumentationController implements TabController {
  private CONTAINER: HTMLElement;
  private TEXT: HTMLElement;
  private remarkable = new Remarkable({ html: true });
  private isIndex = false;

  constructor(content: HTMLElement) {
    this.CONTAINER = content.getElementsByClassName("documentation-container")[0] as HTMLElement;
    this.TEXT = content.getElementsByClassName("documentation-text")[0] as HTMLElement;

    this.loadMarkdown("../docs/INDEX.md");
  }

  saveState(): TabState {
    return {
      type: TabType.Documentation
    };
  }

  restoreState(state: TabState): void {}

  refresh(): void {}

  periodic(): void {}

  private loadMarkdown(markdownPath: string) {
    fetch(markdownPath)
      .then((response) => {
        return response.text();
      })
      .then((text) => {
        let html = this.remarkable.render(text);
        html = html.replaceAll('<span style="color: ', '<span color="'); // Remove color span styles (inline styles not allowed)
        this.TEXT.innerHTML = html;
        this.CONTAINER.scrollTop = 0;

        // Update links
        Array.from(this.TEXT.getElementsByTagName("a")).forEach((link) => {
          let url = link.href;
          link.href = "#";
          link.addEventListener("click", () => {
            if (url.startsWith("http")) {
              window.sendMainMessage("open-link", url);
            } else {
              this.loadMarkdown(this.fixRelativePath(url));
            }
          });
        });

        // Update image URLs
        Array.from(this.TEXT.getElementsByTagName("img")).forEach((img) => {
          if (img.src.startsWith("file:///")) {
            img.src = this.fixRelativePath(img.src);
          }

          // Replace GIFs with videos
          if (img.src.endsWith(".gif")) {
            let video = document.createElement("video");
            video.controls = true;
            video.disablePictureInPicture = true;
            video.disableRemotePlayback = true;
            video.autoplay = true;
            video.loop = true;
            video.src = img.src.slice(0, -4) + ".mp4";
            img.parentElement?.replaceChild(video, img);
          }
        });

        // Apply span colors (removed earlier b/c inline styles aren't allowed)
        Array.from(this.TEXT.getElementsByTagName("span")).forEach((span) => {
          let color = span.getAttribute("color");
          if (color) span.style.color = color.slice(0, -1);
        });

        // App adjustments for index page
        this.isIndex = markdownPath == "../docs/INDEX.md";
        if (this.isIndex) {
          // Add link to online documentation
          let list = this.TEXT.getElementsByTagName("ul")[2];
          let listItem = document.createElement("li");
          list.insertBefore(listItem, list.firstChild);
          let link = document.createElement("a");
          listItem.appendChild(link);
          link.innerText = "Online Documentation";
          link.href = "#";
          link.addEventListener("click", () => {
            window.sendMainMessage(
              "open-link", //TODO add link to docs
              "https://github.com"
            );
          });

          // Add version text
          let paragraph = document.createElement("p");
          this.TEXT.appendChild(paragraph);
          let versionText = document.createElement("em");
          paragraph.appendChild(versionText);
          versionText.innerText = "Version: " + window.appVersion;
        }
      });
  }

  private fixRelativePath(input: string): string {
    if (window.platform == "win32") {
      return "../" + input.slice(11); // Remove "file:///X:/"
    } else {
      return "../" + input.slice(8); // Remove "file:///"
    }
  }
}
