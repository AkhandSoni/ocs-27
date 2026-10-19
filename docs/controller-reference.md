# DualSense control reference

Primary source: [Sony: button functions on PS5](https://www.playstation.com/en-za/support/hardware/ps5-button-functions/).

| Control | PS5 function |
| --- | --- |
| D-pad | Move the highlighted item. |
| Cross | Confirm the highlighted choice. |
| Circle | Cancel or return. |
| PS, tap | Open Control Center. |
| PS, hold | Return to Home. |
| Options | Open contextual options. |
| Create | Open capture tools for screenshots/video. |
| Triangle | Related information or list arrangement, depending on context. |
| Square | A contextual shortcut or additional functions. |
| Touchpad | Assigned by the game. |
| Sticks, L3/R3, L1/L2/R1/R2 | Movement/game-specific controls; no universal confirm/back/home mapping. |

The prototype's existing Square→Back, Triangle/touchpad→Home, L3/R3→Select, and Create→Help assignments are custom shortcuts, not Sony's operating-system defaults. Semantic remapping must distinguish system navigation from each experience's controls.

For browser devices, use the [W3C Standard Gamepad layout](https://www.w3.org/TR/gamepad/#remapping): buttons 0–3 are Cross/Circle/Square/Triangle; 4–7 shoulders/triggers; 8–9 the center pair; 10–11 stick clicks; 12–15 D-pad; 16 the central system button. Additional buttons, including touchpad click, are device/browser-specific.

Pressed feedback must follow **physical control identity**, independently of navigation commands. Two controls can issue “right” while only the input actually held is illuminated. The virtual controller, room hit regions, keyboard representatives, and connected Gamepad feedback now use this distinction; browser tests hold and release all 25 virtual controls individually.
