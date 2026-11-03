from pathlib import Path
import subprocess, concurrent.futures
photos={'hero':'photo-1537996194471-e657df975ab4','bali':'photo-1537996194471-e657df975ab4','yogyakarta':'photo-1516690561799-46d8f74f9abf','jakarta':'photo-1555899434-94d1368aa7af','lombok':'photo-1518548419970-58e3b4079ab2','bandung':'photo-1473448912268-2022ce9509d8','hotel':'photo-1566073771259-6a8506099945','villa':'photo-1613490493576-7fde63acd811','venue':'photo-1519167758481-83f550bb49b3','room':'photo-1611892440504-42a792e24d32'}
def fetch(item):
 name,pid=item
 url='https://images.unsplash.com/'+pid+'?auto=format&fit=crop&w='+('1920' if name=='hero' else '800')+'&q=85'
 target='public/images/'+name+'.jpg'
 subprocess.run(['curl','--fail','--location','--silent','--show-error',url,'--output',target],check=True)
 data=Path(target).read_bytes()
 return name,len(data)
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
 for result in pool.map(fetch,photos.items()):print(result)
