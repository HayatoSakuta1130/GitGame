with open('script.js', 'r', encoding='utf-8') as f:
    script_content = f.read()

with open('index.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

html_content = html_content.replace('<script src="script.js"></script>', '<script>\n' + script_content + '\n</script>')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html_content)
