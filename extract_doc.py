from docx import Document

doc = Document(r'C:\Users\Nyasha Mukarakate\Desktop\LocalConnect\Final-LocalConnect-Documentation.docx')
full_text = []
for para in doc.paragraphs:
    s = para.text.strip()
    if s:
        full_text.append(s)

text = '\n'.join(full_text)

# Save to output file
with open(r'C:\Users\Nyasha Mukarakate\Desktop\LocalConnect\doc_extracted.txt', 'w', encoding='utf-8') as f:
    f.write(text)

print(f"Total characters: {len(text)}")
print("First 3000 chars:")
print(text[:3000])
print("\n--- MIDDLE ---")
print(text[3000:6000])
print("\n--- LATER ---")
print(text[6000:9000])
