"""Live card-scenario driver (certification only; opt-in).

Usage:
  npm run build:test
  EXE=<path to chromium headless shell> SATIM_TEST_CARDS=cards-for-test.md python3 test/live/cards-driver.py [scenario ...]

Requires the Python playwright package. Card data is read from a local,
gitignored markdown table and never written anywhere; results.json holds
masked PANs only.

Live card-scenario driver. Reads cards from cards-for-test.md (never copied
anywhere), registers one order per scenario through the SDK CLI, drives SATIM's
hosted page and 3DS password page, then acknowledges through the SDK.
Writes sanitized results (masked PAN only) to results.json."""
import os, re, sys, json, subprocess, time
from playwright.sync_api import sync_playwright
S=os.environ.get("SATIM_LIVE_OUT","test/live/out")
os.makedirs(S,exist_ok=True)
EXE=os.environ["EXE"]
CARDS=os.environ.get("SATIM_TEST_CARDS","cards-for-test.md")
rows=[l for l in open(CARDS).read().splitlines() if l.startswith("| ") and "`" in l]
cards={}
for l in rows:
    c=[x.strip() for x in l.strip("|").split("|")]
    cards[c[0]]={"pan":c[1].strip("`"),"exp":c[2].strip("`"),"cvv":c[3].strip("`"),"pw":c[4].strip("`")}
wanted=sys.argv[1:] or list(cards)
amounts={"Terminal/transaction amount limit exceeded":"999999.00"}
def cli(*args):
    r=subprocess.run(["node","build/test/live/cli.js",*args],capture_output=True,text=True)
    return json.loads(r.stdout.strip().splitlines()[-1])
results=[]
try: results=json.load(open(f"{S}/results.json"))
except Exception: pass
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=EXE)
    for name in wanted:
        card=cards[name]; mm,yyyy=card["exp"].split("/"); amount=amounts.get(name,"50.00")
        rec={"scenario":name,"masked":"*"*12+card["pan"][-4:],"amount":amount,"t":time.strftime("%H:%M:%S")}
        reg=cli("register",amount,name[:40])
        if not reg.get("ok"): rec["register"]=reg; results.append(rec); print(name,"REGISTER FAILED",reg); continue
        rec["orderId"]=reg["orderId"]; rec["orderNumber"]=reg["orderNumber"]
        pg=b.new_page(viewport={"width":1280,"height":900})
        try:
            pg.goto(reg["formUrl"],timeout=60000); pg.wait_for_selector("#pan_visible",timeout=30000); pg.wait_for_timeout(1000)
            pg.click("#pan_visible"); pg.keyboard.type(card["pan"],delay=15)
            pg.click("#iCVC"); pg.keyboard.type(card["cvv"],delay=15)
            pg.evaluate("([m,y])=>{ $('#month')[0].selectize.setValue(m); $('#year')[0].selectize.setValue(y); }",[mm,yyyy])
            pg.click("#iTEXT"); pg.keyboard.type("TEST HOLDER",delay=15); pg.keyboard.press("Tab"); pg.wait_for_timeout(600)
            rec["fieldCheck"]=pg.evaluate("({cvcLen:document.querySelector('#iCVC').value.length, panOk:document.querySelector('#iPAN').value.slice(-4), m:document.querySelector('#month').value, y:document.querySelector('#year').value, exp:document.querySelector('#expiry').value})")
            if pg.evaluate("document.querySelector('#buttonPayment').disabled"):
                rec["hosted"]="pay button stayed disabled (client-side validation rejected the entry)"
                rec["hostedText"]=re.sub(r"\s+"," ",pg.inner_text("body"))[:300]
            else:
                pg.click("#buttonPayment"); pg.wait_for_timeout(6000)
                if pg.query_selector("#passwordEdit"):
                    rec["hosted"]="3ds password page shown"
                    attempts=3 if "Three incorrect" in name else 1
                    for i in range(attempts):
                        pg.fill("#passwordEdit",card["pw"]); pg.click("button[name=SendPayment2]"); pg.wait_for_timeout(6000)
                        if not pg.query_selector("#passwordEdit"): break
                        rec.setdefault("pwPages",[]).append(re.sub(r"\s+"," ",pg.inner_text("body"))[:200])
                else:
                    rec["hosted"]="no 3ds page"
                rec["finalUrl"]=re.sub(r"(mdOrder|orderId)=[^&]+",r"\1=<id>",pg.url)
                rec["finalText"]=re.sub(r"\s+"," ",pg.inner_text("body"))[:300]
        except Exception as e:
            rec["driverError"]=str(e)[:300]; rec["finalUrl"]=pg.url
        pg.close()
        ack=cli("ack",reg["orderId"]); rec["ack"]=ack
        results=[r for r in results if r["scenario"]!=name]+[rec]
        json.dump(results,open(f"{S}/results.json","w"),indent=1,ensure_ascii=False)
        print(f"{name}: hosted={rec.get('hosted')} final={rec.get('finalUrl','')[:60]} state={ack.get('state') or ack.get('error',{}).get('message')}")
    b.close()
