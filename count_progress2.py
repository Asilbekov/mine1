import json
import os

files = [
    'progress.json',
    'progress_Асилбекова Июль тахрирлаш 46430 та.json',
    'progress_Асилбекова Июнь тахрирлаш 20303 та.json',
    'progress_Асилбекова_Август_тахрирлаш_48606_та.json',
    'progress_Асилбекова_Октябрь_тахрирлаш_14626_та.json',
    'progress_Асилбекова_Сентябрь_тахрирлаш_42930.json'
]

total = 0
for f in files:
    if os.path.exists(f):
        try:
            with open(f, 'r', encoding='utf-8') as fp:
                data = json.load(fp)
                count = len(data)
                total += count
                print(f'Count: {count}')
        except Exception as e:
            print(f'Error reading file: {e}')
    else:
        print(f'File not found: {f}')

print(f'Total: {total}')