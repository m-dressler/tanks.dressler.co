import { loadLevel } from "./Level.js";
import { createServer, connectServer } from "./Network.js";

const onButtonClick = (buttonQuery, handler) => {
  const button = document.querySelector(buttonQuery);
  button.addEventListener("click", (e) => {
    e.stopPropagation();
    handler();
  });
};

export const setPopup = (message) => {
  document.querySelector("#popups").setAttribute("active", "");

  if (typeof message === "string") {
    message = message.replaceAll("\n", "<br/>");
    document.querySelector("#popup .text").innerHTML = message;
  } else if (message instanceof Node) {
    document.querySelector("#popup .text").innerHTML = "";
    document.querySelector("#popup .text").appendChild(message);
  }
};

export const closePopup = () =>
  document.querySelector("#popups").removeAttribute("active");

addEventListener("DOMContentLoaded", () => {
  onButtonClick("#create-server", async () => {
    const { acceptConnection, offer, connectionPromise } = await createServer();

    connectionPromise
      .then(closePopup)
      .catch(() => setPopup("Connection failed"));

    navigator.clipboard.writeText(JSON.stringify(offer));
    const div = document.createElement("div");
    div.appendChild(
      Object.assign(document.createElement("p"), {
        innerHTML:
          "Copied your connection invite to your clipboard.\nSend it to your friend via WhatsApp or Discord.\n\nOnce you copied his response, click the button.",
      })
    );
    const button = Object.assign(document.createElement("button"), {
      innerHTML: "Connect",
    });
    button.addEventListener("click", async () => {
      const string = await navigator.clipboard.readText();
      const json = await new Promise((res) => res(JSON.parse(string))).catch(
        () => void 0
      );
      if (json?.answer?.sdp && json?.candidates?.push) {
        acceptConnection(json);
      } else {
        console.error("INVALID CONNECTION STRING"); // TODO notify user
      }
    });
    div.appendChild(button);
    setPopup(div);
    window.acceptConnection = acceptConnection;
  });
  onButtonClick("#popup .close", closePopup);
  onButtonClick("#connect-server", async () => {
    const string = await navigator.clipboard.readText();
    const json = await new Promise((res) => res(JSON.parse(string))).catch(
      () => void 0
    );
    if (json?.offer?.sdp && json?.candidates?.push) {
      const { answer, connectionPromise } = await connectServer(json);

      connectionPromise
        .then(closePopup)
        .catch(() => setPopup("Connection failed"));

      navigator.clipboard.writeText(JSON.stringify(answer));
      setPopup(
        "Copied your accept letter to your clipboard.\nSend it back to your friend so he can start the game."
      );
    } else {
      console.error("INVALID CONNECTION STRING"); // TODO notify user
    }
  });
  onButtonClick("#start-game", () => {
    loadLevel(1);
    document.getElementById("menu").style.display = "none";
  });
});
