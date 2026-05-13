/**
 * k6 WebSocket smoke: unique join per VU, expect welcome JSON.
 * Requires: k6, running API (+ Supabase), WS_URL (default ws://localhost/)
 */
import ws from "k6/ws";
import { check } from "k6";
import { Counter } from "k6/metrics";

const wsErrors = new Counter("ws_errors");
const nonWelcomeFirstMsg = new Counter("non_welcome_first_msg");
const welcomeTimeouts = new Counter("welcome_timeouts");
const welcomeErrors = new Counter("welcome_errors");

export const options = {
  vus: 20,
  duration: "45s",
};

function usernameForVu(vu) {
  const n = String(vu).padStart(3, "0");
  return `k6_${n}`;
}

export default function () {
  const url = __ENV.WS_URL || "ws://localhost/";
  const username = usernameForVu(__VU);

  const res = ws.connect(
    url,
    {},
    function (socket) {
      let sawWelcome = false;
      let sawError = false;
      let firstMsg = true;

      const timeoutMs = Number(__ENV.WELCOME_TIMEOUT_MS || 3000);
      const timeout = setTimeout(() => {
        if (!sawWelcome) {
          welcomeTimeouts.add(1);
          console.log(`welcome_timeout vu=${__VU} user=${username} ms=${timeoutMs}`);
          socket.close();
        }
      }, timeoutMs);

      socket.on("open", () => {
        socket.send(JSON.stringify({ type: "join", username }));
      });

      socket.on("message", (data) => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch {
          // Non-JSON message: ignore for this smoke test.
          return;
        }

        if (firstMsg && parsed?.type !== "welcome") {
          nonWelcomeFirstMsg.add(1);
          // Print a small sample of what arrived first (usually {type:"error",message:"..."}).
          // Keep it short to avoid overwhelming output under load.
          const preview =
            typeof data === "string" ? data.slice(0, 220) : String(data).slice(0, 220);
          console.log(`first_msg_not_welcome vu=${__VU} user=${username} raw=${preview}`);
          if (parsed && typeof parsed === "object") {
            try {
              console.log(`first_msg_parsed vu=${__VU} user=${username} json=${JSON.stringify(parsed).slice(0, 220)}`);
            } catch {
              // ignore
            }
          }
        }
        firstMsg = false;

        // If we got an error, count it and fail this iteration.
        if (parsed?.type === "error") {
          sawError = true;
          welcomeErrors.add(1);
          console.log(`welcome_error vu=${__VU} user=${username} msg=${String(parsed.message || "").slice(0, 160)}`);
          clearTimeout(timeout);
          check(false, { welcome: (v) => v });
          socket.close();
          return;
        }

        // Ignore presence/history/etc. Keep reading until welcome.
        if (parsed?.type === "welcome" && typeof parsed.userId === "string") {
          sawWelcome = true;
          clearTimeout(timeout);
          check(true, { welcome: (v) => v });
          socket.close();
        }
      });

      socket.on("error", (e) => {
        wsErrors.add(1);
        console.error(`WS error vu=${__VU}: ${String(e)}`);
      });
    }
  );

  check(res, { "status is 101": (r) => r && r.status === 101 });
}
