# 💬 Console

_[< Return to homepage](/docs/INDEX.md)_

The console view is designed to view a single string field with console data. Some suggested fields are listed below.

- **DSEvents** - Robot log from a ".dsevents" file.
- **messages** - Saved by WPILib's built-in logging based on calls to the [_DataLogManager.log_](<https://first.wpi.edu/wpilib/allwpilib/docs/release/java/edu/wpi/first/wpilibj/DataLogManager.html#log(java.lang.String)>) method.
- **/RealOutputs/Console** - Saved by AdvantageKit automatically during robot operation (use _System.out.println_ as normal).
- **/ReplayOutputs/Console** - Saved by AdvantageKit automatically during log replay (use _System.out.println_ as normal).

Drag the desired field to the main view to get started. Each row represents an update to the field. For WPILib logs, a new row is created for each saved line. For AdvantageKit logs, a new row is created for each loop cycle.

![Console view](/docs/resources/console/console-1-dark.png)

The controls are identical to the [table](/docs/tabs/TABLE.md) tab. The selected time is synchronized across all tabs. Click a row to select it, or hover over a row to preview it in any visible pop-up windows. Clicking the ↓ button jumps to the selected time (or the time entered in the box).
