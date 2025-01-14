import Log from "../../packages/log/Log";
import LoggableType from "../../packages/log/LoggableType";
import { checkArrayType } from "../../packages/utils/util";
import { LiveDataSource, LiveDataSourceStatus } from "./LiveDataSource";
import { NT4_Client, NT4_Topic } from "./NT4/NT4";
import Schemas from "./schema/Schemas";

export default class NT4Source extends LiveDataSource {
  private AKIT_PREFIX = "/AdvantageKit";

  private akitMode: boolean;
  private configurableMode: boolean;
  private log: Log | null = null;
  private client: NT4_Client | null = null;

  private shouldRunOutputCallback = false;
  private connectServerTime: number | null = null;
  private noFieldsTimeout: NodeJS.Timeout | null = null;
  private resubscribeTimeout: NodeJS.Timeout | null = null;
  private subscriptionId: number | null = null;

  constructor(akitMode: boolean, configurableMode: boolean) {
    super();
    this.akitMode = akitMode;
    this.configurableMode = configurableMode;

    // Check periodically if output callback should be triggered
    // (prevents running the callback many times for each frame)
    this.shouldRunOutputCallback = false;
    setInterval(() => {
      if (
        !this.shouldRunOutputCallback ||
        this.status == LiveDataSourceStatus.Stopped ||
        !this.outputCallback ||
        !this.log
      )
        return;
      this.shouldRunOutputCallback = false;
      this.outputCallback(this.log, () => {
        if (this.client) {
          let serverTime = this.client.getServerTime_us();
          if (serverTime === null) {
            return 10;
          } else {
            return (serverTime - this.client.getNetworkLatency_us()) / 1000000;
          }
        } else {
          return 10;
        }
      });
    }, 1000 / 60);
  }

  connect(
    address: string,
    statusCallback: (status: LiveDataSourceStatus) => void,
    outputCallback: (log: Log, timeSupplier: () => number) => void
  ) {
    super.connect(address, statusCallback, outputCallback);
    this.shouldRunOutputCallback = false;

    if (window.preferences == null) {
      this.setStatus(LiveDataSourceStatus.Error);
    } else {
      this.log = new Log();
      this.client = new NT4_Client(
        address,
        "In Control",
        (topic: NT4_Topic) => {
          // Announce
          if (!this.log) return;
          let type = this.getLogType(topic.type);
          if (type != null) {
            this.log.createBlankField(this.getKeyFromTopic(topic), type);
          }
          this.shouldRunOutputCallback = true;
        },
        (topic: NT4_Topic) => {
          // Unannounce
        },
        (topic: NT4_Topic, timestamp_us: number, value: unknown) => {
          // Data
          if (!this.log) return;

          if (this.noFieldsTimeout) clearTimeout(this.noFieldsTimeout);
          if (!this.connectServerTime && this.client != null) {
            this.connectServerTime = this.client.getServerTime_us();
          }

          let key = this.getKeyFromTopic(topic);
          let timestamp = Math.max(timestamp_us, this.connectServerTime == null ? 0 : this.connectServerTime) / 1000000;
          let type = this.getLogType(topic.type);

          let updated = false;
          if (type != null) {
            switch (type) {
              case LoggableType.Raw:
                if (value instanceof Uint8Array) {
                  this.log?.putRaw(key, timestamp, value);
                  if (Schemas.has(topic.type)) {
                    Schemas.get(topic.type)!(this.log, key, timestamp, value);
                  }
                  updated = true;
                } else {
                  console.warn('Expected a raw value for "' + key + '" but got:', value);
                }
                break;
              case LoggableType.Boolean:
                if (typeof value === "boolean") {
                  this.log?.putBoolean(key, timestamp, value);
                  updated = true;
                } else {
                  console.warn('Expected a boolean value for "' + key + '" but got:', value);
                }
                break;
              case LoggableType.Number:
                if (typeof value === "number") {
                  this.log?.putNumber(key, timestamp, value);
                  updated = true;
                } else {
                  console.warn('Expected a number value for "' + key + '" but got:', value);
                }
                break;
              case LoggableType.String:
                if (typeof value === "string") {
                  this.log?.putString(key, timestamp, value);
                  updated = true;
                } else {
                  console.warn('Expected a string value for "' + key + '" but got:', value);
                }
                break;
              case LoggableType.BooleanArray:
                if (checkArrayType(value, "boolean")) {
                  this.log?.putBooleanArray(key, timestamp, value as boolean[]);
                  updated = true;
                } else {
                  console.warn('Expected a boolean[] value for "' + key + '" but got:', value);
                }
                break;
              case LoggableType.NumberArray:
                if (checkArrayType(value, "number")) {
                  this.log?.putNumberArray(key, timestamp, value as number[]);
                  updated = true;
                } else {
                  console.warn('Expected a number[] value for "' + key + '" but got:', value);
                }
                break;
              case LoggableType.StringArray:
                if (checkArrayType(value, "string")) {
                  this.log?.putStringArray(key, timestamp, value as string[]);
                  updated = true;
                } else {
                  console.warn('Expected a string[] value for "' + key + '" but got:', value);
                }
                break;
            }
          }
          if (updated) this.shouldRunOutputCallback = true;
        },
        () => {
          // Connected
          this.setStatus(LiveDataSourceStatus.Active);
          this.log = new Log();
          this.shouldRunOutputCallback = true;
          if (this.akitMode) {
            this.noFieldsTimeout = setTimeout(() => {
              window.sendMainMessage("error", {
                title: "Problem with NT4 connection",
                content:
                  "No fields were received from the server. AdvantageKit mode is selected. Are you connecting to a server without AdvantageKit?"
              });
            }, 5000);
          }
          if (!this.configurableMode) {
            // Subscribe with low periodic rate, then resubscribe after topics are received
            if (this.subscriptionId !== null) {
              this.client?.unsubscribe(this.subscriptionId);
            }
            this.subscriptionId = this.client!.subscribe(
              [this.akitMode ? this.AKIT_PREFIX + "/" : "/"],
              true,
              true,
              0.25
            );
            this.resubscribeTimeout = setTimeout(() => {
              if (this.subscriptionId !== null) this.client!.unsubscribe(this.subscriptionId);
              this.subscriptionId = this.client!.subscribe(
                [this.akitMode ? this.AKIT_PREFIX + "/" : "/"],
                true,
                true,
                0.02
              );
            }, 1000);
          }
        },
        () => {
          // Disconnected
          this.setStatus(LiveDataSourceStatus.Connecting);
          this.shouldRunOutputCallback = false;
          this.connectServerTime = null;
          if (this.resubscribeTimeout) clearTimeout(this.resubscribeTimeout);
          if (this.noFieldsTimeout) clearTimeout(this.noFieldsTimeout);
        }
      );
      this.client.connect();
      if (this.akitMode) {
        this.client?.subscribe([this.AKIT_PREFIX + "/"], true, true, 0);
      } else if (this.configurableMode) {
        for (const key of window.preferences.keys) {
          console.log(
            "Key: " + key + " key[0] " + key[0] + " key[1] " + key[1] + " key[2] " + key[2] + " key[3] " + key[3]
          );
          this.client?.subscribe([key[0]], key[1], key[2], key[3]);
        }
        for (const publisher of window.preferences.publishers) {
          this.publishTopic(publisher[0], publisher[1]);
        }
      } else {
        this.client?.subscribe(["/"], true, true, 0);
        for (const publisher of window.preferences.publishers) {
          this.publishTopic(publisher[0], publisher[1]);
        }
      }
    }
  }

  stop() {
    super.stop();
    this.client?.disconnect();
  }

  publishTopic(topic: string, type: string) {
    console.log("Publishing topic: " + topic + " type: " + type);
    if (this.client) {
      this.client.publishTopic(topic, type);
    }
  }

  publishValue(topic: string, value: unknown) {
    if (this.client) {
      this.client.addSample(topic, value);
    }
  }

  /** Gets the name of the topic, depending on whether we're running in AdvantageKit mode. */
  private getKeyFromTopic(topic: NT4_Topic): string {
    if (this.akitMode) {
      return topic.name.slice(this.AKIT_PREFIX.length);
    } else {
      return topic.name;
    }
  }

  private getLogType(ntType: string): LoggableType {
    switch (ntType) {
      case "boolean":
        return LoggableType.Boolean;
      case "int":
      case "float":
      case "double":
        return LoggableType.Number;
      case "string":
      case "json":
        return LoggableType.String;
      case "boolean[]":
        return LoggableType.BooleanArray;
      case "int[]":
      case "float[]":
      case "double[]":
        return LoggableType.NumberArray;
      case "string[]":
        return LoggableType.StringArray;
      default: // Default to raw
        return LoggableType.Raw;
    }
  }
}
