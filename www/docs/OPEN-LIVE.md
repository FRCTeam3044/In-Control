# Connecting to Live Sources

_[< Return to homepage](/docs/INDEX.md)_

All visualizations in In Control are designed to receive live data from a robot or simulator in addition to log files. This section describes how to connect to real time data sources.

## Configuration

Open the preferences window by pressing **cmd/ctrl + comma** or clicking "Options" > Preferences..." (Windows/Linux) or "In Control" > "Preferences..." (macOS). Update the "roboRIO Address" and "Live Mode (options listed below).

> Note: Click "Data" > "Connections" > "Use USB roboRIO Address" to temporarily use the IP address "172.22.11.2" for all connections.

- **NetworkTables 4:** This is the default networking protocol starting in WPILib 2023, and is commonly used by dashboards, coprocessors, etc. See the [WPILib documentation](https://docs.wpilib.org/en/stable/docs/software/networktables/index.html) for more details. Note that NetworkTables 3 (used by WPILib 2022 and older) is not supported by In Control. Defualt **NetworkTables 4** will subscribe to everything & update all connections as fast as possible.
- **NetworkTables 4 (AdvantageKit):** This mode is designed for use with robot code running AdvantageKit, which publishes to the "/AdvantageKit" table in NetworkTables. The only difference from the **NetworkTables 4** mode is that the "/AdvantageKit" table is used as the root, which allows for easier switching between an NT4 connection and an AdvantageKit log file.
- **NetworkTables 4 (Configurable):** This mode is designed to give you full control over the NT4 connections, refresh rate, & other details through adding subscriber keys & enabling publishers, by importing a [config JSON](/docs/NT4CONFIGURABLE.md) by clicking "Options" > "Import NT4 Config..."
- **RLOG Server:** This protocol is used by AdvantageKit v1 (2022), and is included for compatibility with older code bases. Note that the "RLOG Server Port" must be set to use this mode.

![Diagram of live preferences](/docs/resources/open-live/open-live-1-dark.png)

## Starting the Connection

To start the connection to a robot (using the configured "roboRIO Address") or a simulator (using "127.0.0.1"), follow these steps:

- **Robot:** Click "Data" > "Connections" > "Connect to Robot" or press **cmd/ctrl + K**
- **Robot (USB):** Click "Data" > "Connections" > "Use USB roboRIO Address " and then connect to the robot as normal
- **Simulator:** Click "Data" > "Connections" > "Connect to Simulator" or press **shift + cmd/ctrl + K**

The window title displays the IP address and the text "Searching" until the robot/sim is connected. It attempts to reconnect automatically using the same settings after a disconnect.

## Viewing Live Data

When connected to a live source, In Control locks all tabs to the current time by default. Views like the [line graph](/docs/tabs/LINE-GRAPH.md) and [table](/docs/tabs/TABLE.md) autoscroll, and views like odometry and joysticks display the current values of each field. Clicking the red arrow button in the navigation bar toggles this lock, enabling viewing and replay of past data.

> Note: Scrolling to the left in the line graph also unlocks from the current time, and scrolling all the way to the right locks to the current time again.
