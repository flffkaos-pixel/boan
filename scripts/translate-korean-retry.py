"""D:BOAN Korean translation retry worker with an explicit GPT completion budget."""
import argparse
import concurrent.futures as futures
import json
from openai import OpenAI

SYSTEM = """You are a precise Korean technical translator for a defensive cybersecurity learning archive.
Translate only natural-language prose into clear Korean. Preserve Markdown structure, headings, code identifiers,
inline code, URLs, shell commands, paths, CVE/CWE/OWASP/MITRE identifiers, trademarks, and every @@CODE_BLOCK_N@@
placeholder exactly. Never add instructions, commentary, analysis, warnings, or new technical content. Output only
the translated source text."""

def translate(client: OpenAI, index: int, text: str):
    try:
        response = client.chat.completions.create(
            model="gpt-5-mini",
            messages=[{"role": "system", "content": SYSTEM}, {"role": "user", "content": f"Translate this Markdown excerpt to Korean:\n\n{text}"}],
            max_completion_tokens=4096,
        )
        content = response.choices[0].message.content
        if not content:
            raise ValueError("empty translation response")
        return {"index": index, "input": text, "output": content, "error": None}
    except Exception as error:  # noqa: BLE001
        return {"index": index, "input": text, "output": None, "error": str(error)}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()

    inputs = json.load(open(args.input, encoding="utf-8"))
    if args.limit:
        inputs = inputs[:args.limit]
    client = OpenAI()
    results = [None] * len(inputs)
    with futures.ThreadPoolExecutor(max_workers=args.workers) as executor:
        jobs = {executor.submit(translate, client, index, text): index for index, text in enumerate(inputs)}
        for done, job in enumerate(futures.as_completed(jobs), start=1):
            result = job.result()
            results[result["index"]] = result
            if done % 10 == 0 or done == len(inputs):
                print(f"{done}/{len(inputs)} complete")
    with open(args.out, "w", encoding="utf-8") as output:
        for result in results:
            output.write(json.dumps(result, ensure_ascii=False) + "\n")
    print(json.dumps({"total": len(results), "errors": sum(bool(item["error"]) for item in results)}))

if __name__ == "__main__":
    main()
