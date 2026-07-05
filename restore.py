import re
with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(r'<script>\nwindow\.onerror.*?</script>\n', '', text, flags=re.DOTALL)
text = re.sub(r'<script>\nconst canvas = document.*?</script>', '<script src="script.js"></script>', text, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)
