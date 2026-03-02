import os
import re
import time

TARGET_FILES = [
    r"c:\Users\Nyasha Mukarakate\Desktop\LocalConnect\src\app\components\shop-owner\ShopOwnerDashboard.tsx",
    r"c:\Users\Nyasha Mukarakate\Desktop\LocalConnect\src\app\components\marketplace\MarketplaceScreen.tsx",
    r"c:\Users\Nyasha Mukarakate\Desktop\LocalConnect\src\app\components\admin\AdminDashboard.tsx",
    r"c:\Users\Nyasha Mukarakate\Desktop\LocalConnect\src\app\components\ambassador\AmbassadorPortal.tsx",
    r"c:\Users\Nyasha Mukarakate\Desktop\LocalConnect\src\app\components\ai-assistant\FloatingAIAssistant.tsx",
]

REPLACEMENTS = {
    r"from-\[#F0F9FF\] to-\[#E0F2FE\]": "slate-50",
    r"bg-gradient-to-br from-\[#F0F9FF\] to-\[#E0F2FE\]": "bg-slate-50",
    r"bg-gradient-to-r from-\[#1E40AF\] to-\[#065F46\]": "bg-gradient-to-r from-blue-600 to-emerald-600",
    r"bg-gradient-to-br from-\[#1E40AF\] to-\[#065F46\]": "bg-gradient-to-br from-blue-600 to-emerald-600",
    r"from-\[#1E40AF\] to-\[#065F46\]": "from-blue-600 to-emerald-600",
    r"text-\[#1E40AF\]": "text-blue-600",
    r"text-\[#065F46\]": "text-emerald-600",
    r"text-\[#0F172A\]": "text-slate-900",
    r"text-\[#64748B\]": "text-slate-500",
    r"text-\[#3B82F6\]": "text-blue-500",
    r"text-\[#10B981\]": "text-emerald-500",
    r"text-\[#EF4444\]": "text-red-500",
    r"text-\[#F59E0B\]": "text-amber-500",
    r"border-\[#E2E8F0\]": "border-slate-200",
    r"border-\[#BFDBFE\]": "border-blue-200",
    r"border-\[#FEE2E2\]": "border-red-200",
    r"bg-\[#F1F5F9\]": "bg-slate-100",
    r"bg-\[#F8FAFC\]": "bg-slate-50",
    r"bg-\[#E2E8F0\]": "bg-slate-200",
    r"bg-\[#F0F9FF\]": "bg-blue-50",
    r"bg-\[#E0F2FE\]": "bg-blue-100",
    r"bg-\[#FEF2F2\]": "bg-red-50",
    r"bg-\[#10B981\]": "bg-emerald-500",
    r"bg-\[#F59E0B\]": "bg-amber-500",
    r"bg-\[#EF4444\]": "bg-red-500",
    r"bg-\[#64748B\]": "bg-slate-500",
    # Specific edge cases for Admin Dashboard / others
    r"from-\[#7C3AED\] to-\[#5B21B6\]": "from-purple-600 to-purple-800",
}

for filepath in TARGET_FILES:
    if not os.path.exists(filepath):
        print(f"Skipping {filepath}, does not exist.")
        continue
        
    print(f"Processing {filepath}...")
    
    # Try multiple times in case it's locked by Vite
    success = False
    for attempt in range(5):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            for pattern, replacement in REPLACEMENTS.items():
                content = re.sub(pattern, replacement, content)
                
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
                
            success = True
            print(f"Successfully updated {filepath}")
            break
        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {e}")
            time.sleep(1)
            
    if not success:
        print(f"Failed to process {filepath} after 5 attempts.")
