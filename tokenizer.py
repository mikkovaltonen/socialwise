#!/usr/bin/env python3
"""
Token counter for documents in the chat_init_contect folder.
Counts tokens using OpenAI's tiktoken library with different encoding models.
"""

import os
import json
import tiktoken
from pathlib import Path
from typing import Dict, List, Tuple


def get_file_size_mb(file_path: str) -> float:
    """Get file size in MB"""
    return os.path.getsize(file_path) / (1024 * 1024)


def count_tokens(text: str, encoding_name: str = "cl100k_base") -> int:
    """Count tokens in text using specified encoding"""
    encoding = tiktoken.get_encoding(encoding_name)
    return len(encoding.encode(text))


def analyze_document(file_path: str) -> Dict[str, any]:
    """Analyze a single document for token counts"""
    file_name = os.path.basename(file_path)
    file_size_mb = get_file_size_mb(file_path)
    
    # Read file content
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Count tokens with different encodings
    results = {
        "file_name": file_name,
        "file_size_mb": round(file_size_mb, 2),
        "character_count": len(content),
        "line_count": content.count('\n') + 1,
        "tokens": {
            "gpt-4 (cl100k_base)": count_tokens(content, "cl100k_base"),
            "gpt-3.5-turbo (cl100k_base)": count_tokens(content, "cl100k_base"),
            "text-davinci-003 (p50k_base)": count_tokens(content, "p50k_base"),
            "davinci (r50k_base)": count_tokens(content, "r50k_base"),
        }
    }
    
    # Add approximate token/character ratio
    results["avg_tokens_per_1k_chars"] = round(
        results["tokens"]["gpt-4 (cl100k_base)"] / (len(content) / 1000), 2
    )
    
    return results


def format_number(num: int) -> str:
    """Format number with thousands separator"""
    return f"{num:,}"


def main():
    # Directory to analyze
    docs_dir = "/mnt/c/Users/mikbu/Documents/valmet-buyer/public/chat_init_contect"
    
    if not os.path.exists(docs_dir):
        print(f"Error: Directory not found: {docs_dir}")
        return
    
    # Get all files in the directory
    files = [f for f in os.listdir(docs_dir) if os.path.isfile(os.path.join(docs_dir, f))]
    
    if not files:
        print("No files found in the directory.")
        return
    
    print(f"\n{'='*80}")
    print(f"TOKEN ANALYSIS FOR CHAT CONTEXT DOCUMENTS")
    print(f"Directory: {docs_dir}")
    print(f"{'='*80}\n")
    
    total_tokens = {"gpt-4": 0, "gpt-3.5": 0, "davinci-003": 0, "davinci": 0}
    all_results = []
    
    # Analyze each file
    for file_name in sorted(files):
        file_path = os.path.join(docs_dir, file_name)
        print(f"Analyzing: {file_name}...")
        
        try:
            result = analyze_document(file_path)
            all_results.append(result)
            
            # Update totals
            total_tokens["gpt-4"] += result["tokens"]["gpt-4 (cl100k_base)"]
            total_tokens["gpt-3.5"] += result["tokens"]["gpt-3.5-turbo (cl100k_base)"]
            total_tokens["davinci-003"] += result["tokens"]["text-davinci-003 (p50k_base)"]
            total_tokens["davinci"] += result["tokens"]["davinci (r50k_base)"]
            
        except Exception as e:
            print(f"  ⚠️  Error processing {file_name}: {e}")
    
    # Print individual file results
    print(f"\n{'='*80}")
    print("INDIVIDUAL FILE ANALYSIS")
    print(f"{'='*80}\n")
    
    for result in all_results:
        print(f"\n📄 {result['file_name']}")
        print(f"   Size: {result['file_size_mb']} MB")
        print(f"   Characters: {format_number(result['character_count'])}")
        print(f"   Lines: {format_number(result['line_count'])}")
        print(f"   Tokens:")
        for model, count in result['tokens'].items():
            print(f"     • {model}: {format_number(count)} tokens")
        print(f"   Avg tokens per 1k chars: {result['avg_tokens_per_1k_chars']}")
    
    # Print summary
    print(f"\n{'='*80}")
    print("TOTAL TOKEN COUNT (ALL DOCUMENTS)")
    print(f"{'='*80}\n")
    
    print(f"🔢 GPT-4/GPT-3.5-Turbo: {format_number(total_tokens['gpt-4'])} tokens")
    print(f"🔢 Text-Davinci-003: {format_number(total_tokens['davinci-003'])} tokens")
    print(f"🔢 Davinci: {format_number(total_tokens['davinci'])} tokens")
    
    # Context window comparison
    print(f"\n{'='*80}")
    print("CONTEXT WINDOW USAGE")
    print(f"{'='*80}\n")
    
    context_windows = {
        "GPT-4 (128k)": 128000,
        "GPT-4 (32k)": 32768,
        "GPT-4 (8k)": 8192,
        "GPT-3.5-Turbo (16k)": 16384,
        "GPT-3.5-Turbo (4k)": 4096,
        "Claude 3 (200k)": 200000,
        "Claude 2.1 (100k)": 100000,
    }
    
    gpt4_tokens = total_tokens['gpt-4']
    
    for model, window_size in context_windows.items():
        percentage = (gpt4_tokens / window_size) * 100
        remaining = window_size - gpt4_tokens
        
        if gpt4_tokens <= window_size:
            status = "✅"
            print(f"{status} {model}: {percentage:.1f}% used ({format_number(remaining)} tokens remaining)")
        else:
            status = "❌"
            print(f"{status} {model}: {percentage:.1f}% (exceeds by {format_number(-remaining)} tokens)")
    
    # Cost estimation (approximate)
    print(f"\n{'='*80}")
    print("APPROXIMATE COST ESTIMATION (per request)")
    print(f"{'='*80}\n")
    
    # Pricing as of 2024 (in USD per 1k tokens)
    pricing = {
        "GPT-4 Turbo Input": 0.01,
        "GPT-4 Turbo Output": 0.03,
        "GPT-3.5-Turbo Input": 0.0005,
        "GPT-3.5-Turbo Output": 0.0015,
    }
    
    gpt4_input_cost = (gpt4_tokens / 1000) * pricing["GPT-4 Turbo Input"]
    gpt35_input_cost = (total_tokens['gpt-3.5'] / 1000) * pricing["GPT-3.5-Turbo Input"]
    
    print(f"💰 GPT-4 Turbo (input only): ${gpt4_input_cost:.4f}")
    print(f"💰 GPT-3.5-Turbo (input only): ${gpt35_input_cost:.4f}")
    print(f"\n📝 Note: Output costs would be additional based on response length")
    
    print(f"\n{'='*80}\n")


if __name__ == "__main__":
    main()