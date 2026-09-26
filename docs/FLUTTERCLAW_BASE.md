# FlutterClaw Base

This branch adopts FlutterClaw as the single mobile-app base instead of stacking multiple assistant runtimes.

Upstream:
https://github.com/flutterclaw/flutterclaw

Pinned source: FlutterClaw repository default branch at the time this base was selected.

License: MIT.

The upstream project provides the mobile Flutter application, embedded gateway/agent runtime, 40+ built-in tools, MCP, multi-provider routing, multimodal input, voice, channels, device tools, scheduling, sandbox, skills and subagents.

Migration rule for this branch:
- Do not layer another agent runtime beside FlutterClaw.
- Do not duplicate its tool registry, provider router, session system, MCP layer, sandbox, scheduler or device runtime.
- Bossnu-specific requirements should be expressed through the FlutterClaw base rather than a second parallel architecture.
- Verify build and runtime before considering the migration complete.

Source verification:
https://github.com/flutterclaw/flutterclaw
