with open('js/storage.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("fetch('/api/", "apiFetch('")
content = content.replace("fetch(`/api/", "apiFetch(`")

with open('js/storage.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('Replaced storage.js fetch calls successfully.')
