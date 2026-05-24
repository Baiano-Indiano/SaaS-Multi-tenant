import json

log_path = r"C:\Users\Bernardo\.gemini\antigravity\brain\b625aa6e-4be6-4e56-937b-57184de68ada\.system_generated\logs\transcript.jsonl"

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        if "incrementUsage" in str(data):
            print(f"Parent Step {data.get('step_index')}, type: {data.get('type')}, source: {data.get('source')}")
