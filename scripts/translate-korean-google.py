"""D:BOAN fallback translator for public English learning prose, using small resilient request chunks."""
import argparse
import concurrent.futures as futures
import json
import time
import urllib.parse
import urllib.request

ENDPOINT = "https://clients5.google.com/translate_a/t"

def translate(index: int, text: str):
    query = urllib.parse.urlencode({"client": "dict-chrome-ex", "sl": "en", "tl": "ko", "q": text})
    request = urllib.request.Request(f"{ENDPOINT}?{query}", headers={"User-Agent": "Mozilla/5.0"})
    last_error = None
    for attempt in range(5):
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                translated = json.loads(response.read().decode("utf-8"))[0]
            if not translated:
                raise ValueError("empty translation response")
            return {"index": index, "input": text, "output": translated, "error": None}
        except Exception as error:  # noqa: BLE001
            last_error = str(error)
            time.sleep(1.5 * (attempt + 1))
    return {"index": index, "input": text, "output": None, "error": last_error}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--workers", type=int, default=2)
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()
    inputs = json.load(open(args.input, encoding="utf-8"))
    if args.limit:
        inputs = inputs[:args.limit]
    results = [None] * len(inputs)
    with futures.ThreadPoolExecutor(max_workers=args.workers) as executor:
        jobs = {executor.submit(translate, index, text): index for index, text in enumerate(inputs)}
        for completed, job in enumerate(futures.as_completed(jobs), start=1):
            result = job.result()
            results[result["index"]] = result
            if completed % 20 == 0 or completed == len(inputs):
                print(f"{completed}/{len(inputs)} complete")
            time.sleep(0.1)
    with open(args.out, "w", encoding="utf-8") as output:
        for result in results:
            output.write(json.dumps(result, ensure_ascii=False) + "\n")
    print(json.dumps({"total": len(results), "errors": sum(bool(item["error"]) for item in results)}))

if __name__ == "__main__":
    main()
