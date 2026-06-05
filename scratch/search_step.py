import json

log_path = r"C:\Users\Bernardo\.gemini\antigravity\brain\4301bae5-56da-46ed-8635-bc555c40e4c4\.system_generated\logs\transcript.jsonl"

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        content = str(data)
        if "incrementUsage" in content:
            print(f"Found in step: {data.get('step_index')}, type: {data.get('type')}, source: {data.get('source')}")
