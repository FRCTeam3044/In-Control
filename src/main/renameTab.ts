const NAME_INPUT = document.getElementById("name") as HTMLInputElement;
const EXIT_BUTTON = document.getElementById("exit") as HTMLInputElement;
const CONFIRM_BUTTON = document.getElementById("confirm") as HTMLInputElement;

window.addEventListener("message", (event) => {
  if (event.source == window && event.data == "port") {
    let messagePort = event.ports[0];
    messagePort.onmessage = ({ data: oldName }) => {
      // Update button focus
      if (typeof oldName === "object" && "isFocused" in oldName) {
        Array.from(document.getElementsByTagName("button")).forEach((button) => {
          if (oldName.isFocused) {
            button.classList.remove("blurred");
          } else {
            button.classList.add("blurred");
          }
        });
        return;
      }

      // Normal message

      // Update values
      NAME_INPUT.value = oldName;

      // Close function
      function confirm() {
        messagePort.postMessage(NAME_INPUT.value);
      }

      // Set up exit triggers
      EXIT_BUTTON.addEventListener("click", () => {
        messagePort.postMessage(oldName);
      });
      CONFIRM_BUTTON.addEventListener("click", confirm);
      window.addEventListener("keydown", (event) => {
        if (event.code == "Enter") confirm();
      });
    };
  }
});
