#!/bin/bash

# Hook script that transforms Claude Code events and sends them to the Electron app server
# Receives hook data via stdin, normalizes event types, and POSTs to the app's hook endpoint

HOOK_DATA=$(cat)

PAYLOAD=$(echo "$HOOK_DATA" | node -e "
  const chunks = [];
  process.stdin.on('data', c => chunks.push(c));
  process.stdin.on('end', () => {
    const hookData = JSON.parse(Buffer.concat(chunks).toString());
    const hookEvent = hookData.hook_event_name || 'unknown';

    // Map Claude Code hook event names to app-specific event types
    const eventMap = {
      PreToolUse: 'tool_use',
      PostToolUse: 'tool_result',
      PostToolUseFailure: 'tool_failure',
      UserPromptSubmit: 'thinking_start',
      Stop: 'thinking_end',
      PermissionRequest: 'permission_request',
      Notification: 'notification',
      SessionStart: 'session_start',
      SessionEnd: 'session_end',
      SubagentStop: 'subagent_complete',
      PreCompact: 'compact_start',
    };

    // Retrieve agent ID from Claude Code environment variable
    const agentId = process.env.CLAUDE_AGENT_ID || 'unknown';

    // Build normalized payload with metadata for the app
    const payload = {
      agentId,
      eventType: eventMap[hookEvent] || 'message',
      timestamp: Date.now(),
      data: hookData,
    };

    console.log(JSON.stringify(payload));
  });
")

# POST the payload to the Electron app's hook server endpoint
curl -s -X POST "http://localhost:3067/hooks/agent-event" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"

exit 0
