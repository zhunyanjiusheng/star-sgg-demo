from functools import lru_cache

import torch
from fastapi import FastAPI
from pydantic import BaseModel

MODEL_PATH = "/root/autodl-tmp/Qwen3-VL-8B-Instruct"

app = FastAPI()


class GenerateRequest(BaseModel):
    prompt: str
    max_new_tokens: int = 256


@lru_cache(maxsize=1)
def load_model():
    from transformers import AutoProcessor, Qwen3VLForConditionalGeneration

    print(f"[Qwen Text] Loading model from {MODEL_PATH}")

    processor = AutoProcessor.from_pretrained(
        MODEL_PATH,
        trust_remote_code=True,
    )

    model = Qwen3VLForConditionalGeneration.from_pretrained(
        MODEL_PATH,
        dtype="auto",
        device_map="auto",
        trust_remote_code=True,
    )

    model.eval()
    print("[Qwen Text] Model loaded")

    return processor, model


@app.post("/generate")
def generate(req: GenerateRequest):
    processor, model = load_model()

    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": req.prompt,
                }
            ],
        }
    ]

    inputs = processor.apply_chat_template(
        messages,
        tokenize=True,
        add_generation_prompt=True,
        return_dict=True,
        return_tensors="pt",
    )

    inputs = inputs.to(model.device)

    with torch.no_grad():
        generated_ids = model.generate(
            **inputs,
            max_new_tokens=req.max_new_tokens,
            do_sample=False,
        )

    generated_ids_trimmed = [
        out_ids[len(in_ids):]
        for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
    ]

    answer = processor.batch_decode(
        generated_ids_trimmed,
        skip_special_tokens=True,
        clean_up_tokenization_spaces=False,
    )[0].strip()

    return {
        "status": "ok",
        "answer": answer,
    }
