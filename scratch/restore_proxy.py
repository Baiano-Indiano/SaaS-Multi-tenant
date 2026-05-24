import json
import re

log_path = r"C:\Users\Bernardo\.gemini\antigravity\brain\4301bae5-56da-46ed-8635-bc555c40e4c4\.system_generated\logs\transcript.jsonl"
target_path = r"c:\Users\Bernardo\Desktop\SaaS Multi-tenant\src\proxy.ts"

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        if data.get('step_index') == 12:
            content = data['content']
            break
    else:
        raise ValueError("Step 12 not found in transcript.jsonl")

# Find the start of the file code (line starting with "1: ")
lines = content.split('\n')
start_idx = -1
for idx, l in enumerate(lines):
    if l.startswith("1: "):
        start_idx = idx
        break

if start_idx == -1:
    raise ValueError("Could not find start of code lines in step 12 content")

code_lines = []
for l in lines[start_idx:]:
    # Match "<number>: <code_line>" and extract the code line
    match = re.match(r'^\d+: (.*)$', l)
    if match:
        code_lines.append(match.group(1))
    elif l == "":
        code_lines.append("")

# Write reconstructed code to proxy.ts
with open(target_path, 'w', encoding='utf-8', newline='') as f:
    f.write('\n'.join(code_lines))

print("Successfully restored proxy.ts from transcript step 12")
