import urllib.request,urllib.error,json,uuid
url='https://qvbyrkuoagskwetoociz.supabase.co/functions/v1/training-registration'
def submit(gender,number):
 boundary='----gender'+uuid.uuid4().hex
 fields={'stageId':'a8fe846a-48a4-49c8-8541-66976eac1ffe','firstName':'اختبار','lastName':'بطاقات','phone':number,'birth':'2000-01-01'}
 if gender is not None:fields['gender']=gender
 body=''.join('--'+boundary+'\r\nContent-Disposition: form-data; name="'+k+'"\r\n\r\n'+v+'\r\n' for k,v in fields.items())+'--'+boundary+'--\r\n'
 req=urllib.request.Request(url,data=body.encode(),headers={'apikey':'sb_publishable_LnRL8UGGU1pu_i46odcGQg_4qnRte3W','Content-Type':'multipart/form-data; boundary='+boundary})
 try:
  with urllib.request.urlopen(req,timeout=30) as r:return r.status,json.load(r)
 except urllib.error.HTTPError as e:return e.code,json.load(e)
for value,phone in [(None,'20000000'),('invalid','20000001')]:
 status,data=submit(value,phone);assert status==400 and 'الجنس' in data.get('error',''),(status,data)
 print('PASS missing or invalid sex rejected')
for value,phone in [('male','20000002'),('female','20000003')]:
 status,data=submit(value,phone);assert status==200 and data.get('ok'),(status,data)
 print('PASS registration accepted for '+value)
