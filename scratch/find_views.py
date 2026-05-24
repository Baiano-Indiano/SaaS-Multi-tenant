import json

log_path = r"C:\Users\Bernardo\.gemini\antigravity\brain\4301bae5-56da-46ed-8635-bc555c40e4c4\.system_generated\logs\transcript.jsonl"

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        tool_calls = data.get('tool_calls', [])
        for tc in tool_calls:
            args = tc.get('args', {})
            # Look for proxy.ts in arguments
            args_str = str(args)
            if 'proxy.ts' in args_str:
                print(f"Step {data.get('step_index')}: tool={tc.get('name')}, args={args_str[:200]}")
