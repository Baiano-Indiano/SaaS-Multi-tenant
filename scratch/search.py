import shutil

src = r"C:\Users\Bernardo\.gemini\antigravity\get-shit-done\workflows\plan-phase.md"
dst = r"c:\Users\Bernardo\Desktop\SaaS Multi-tenant\scratch\plan-phase.md"
shutil.copy(src, dst)
print("Copied plan-phase workflow successfully!")
