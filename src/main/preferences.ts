import Preferences from "../packages/convenience/Preferences";

const THEME = document.getElementById("theme") as HTMLInputElement;
const RIO_ADDRESS = document.getElementById("rioAddress") as HTMLInputElement;
const RIO_PATH = document.getElementById("rioPath") as HTMLInputElement;
const LIVE_MODE = document.getElementById("liveMode") as HTMLInputElement;
const RLOG_PORT = document.getElementById("rlogPort") as HTMLInputElement;
const THREE_DIMENSION_MODE = document.getElementById("threeDimensionMode") as HTMLInputElement;
const DASHBOARD_MODE = document.getElementById("dashboardMode") as HTMLInputElement;
const EXIT_BUTTON = document.getElementById("exit") as HTMLInputElement;
const CONFIRM_BUTTON = document.getElementById("confirm") as HTMLInputElement;

window.addEventListener("message", (event) => {
  if (event.source == window && event.data == "port") {
    let messagePort = event.ports[0];
    messagePort.onmessage = ({ data }) => {
      // Update button focus
      if (typeof data === "object" && "isFocused" in data) {
        Array.from(document.getElementsByTagName("button")).forEach((button) => {
          if (data.isFocused) {
            button.classList.remove("blurred");
          } else {
            button.classList.add("blurred");
          }
        });
        return;
      }

      // Normal message
      let platform: string = data.platform;
      let oldPrefs: Preferences = data.prefs;

      // Update values
      if (platform == "linux") {
        (THEME.children[0] as HTMLElement).hidden = true;
        (THEME.children[1] as HTMLElement).innerText = "Light";
        (THEME.children[2] as HTMLElement).innerText = "Dark";
      }
      THEME.value = oldPrefs.theme;
      RIO_ADDRESS.value = oldPrefs.rioAddress;
      RIO_PATH.value = oldPrefs.rioPath;
      LIVE_MODE.value = oldPrefs.liveMode;
      RLOG_PORT.value = oldPrefs.rlogPort.toString();
      THREE_DIMENSION_MODE.value = oldPrefs.threeDimensionMode;
      DASHBOARD_MODE.value = oldPrefs.dashboardMode;

      // Close function
      function close(useNewPrefs: boolean) {
        if (useNewPrefs) {
          let theme: "light" | "dark" | "system" = "system";
          if (THEME.value == "light") theme = "light";
          if (THEME.value == "dark") theme = "dark";
          if (THEME.value == "system") theme = "system";

          let liveMode: "nt4" | "nt4-akit" | "nt4-configurable" | "rlog";
          liveMode = "nt4";
          if (LIVE_MODE.value == "nt4") liveMode = "nt4";
          if (LIVE_MODE.value == "nt4-akit") liveMode = "nt4-akit";
          if (LIVE_MODE.value == "nt4-configurable") liveMode = "nt4-configurable";
          if (LIVE_MODE.value == "rlog") liveMode = "rlog";

          let threeDimensionMode: "quality" | "efficiency" | "auto" = "quality";
          if (THREE_DIMENSION_MODE.value == "quality") threeDimensionMode = "quality";
          if (THREE_DIMENSION_MODE.value == "efficiency") threeDimensionMode = "efficiency";
          if (THREE_DIMENSION_MODE.value == "auto") threeDimensionMode = "auto";

          let dashboardMode: "sim" | "real" | "none" = "none";
          if (DASHBOARD_MODE.value == "sim") dashboardMode = "sim";
          if (DASHBOARD_MODE.value == "real") dashboardMode = "real";
          if (DASHBOARD_MODE.value == "none") dashboardMode = "none";

          // Preserve old keys
          let keys = oldPrefs.keys;
          let publishers = oldPrefs.publishers;

          let newPrefs: Preferences = {
            theme,
            rioAddress: RIO_ADDRESS.value,
            rioPath: RIO_PATH.value,
            liveMode: liveMode,
            rlogPort: Number(RLOG_PORT.value),
            threeDimensionMode,
            keys,
            publishers,
            dashboardMode
          };
          messagePort.postMessage(newPrefs);
        } else {
          messagePort.postMessage(oldPrefs);
        }
      }

      // Set up exit triggers
      EXIT_BUTTON.addEventListener("click", () => {
        close(false);
      });
      CONFIRM_BUTTON.addEventListener("click", () => close(true));
      window.addEventListener("keydown", (event) => {
        if (event.code == "Enter") close(true);
      });
    };
  }
});
